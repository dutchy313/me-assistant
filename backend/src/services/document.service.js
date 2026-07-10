import Document from "../models/Document.js";
import SourceChunk from "../models/SourceChunk.js";
import IngestionLog from "../models/IngestionLog.js";
import {
  downloadDriveFileAsBuffer,
  listFilesInDriveFolder
} from "./googleDrive.service.js";
import { extractTextFromPdfBuffer } from "./pdfExtraction.service.js";
import { splitTextIntoChunks } from "./chunking.service.js";

function getFileExtension(fileName = "") {
  const parts = fileName.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.pop().toLowerCase();
}

function inferSourceType(fileName = "") {
  const lowerName = fileName.toLowerCase();

  if (lowerName.includes("manual")) return "manual";
  if (lowerName.includes("guide")) return "guide";
  if (lowerName.includes("report")) return "report";

  return "book";
}

function mapDriveFileToDocument(file) {
  return {
    title: file.name.replace(/\.[^/.]+$/, ""),
    fileName: file.name,
    fileType: getFileExtension(file.name),
    sourceType: inferSourceType(file.name),
    driveFileId: file.id,
    driveMimeType: file.mimeType || "",
    driveModifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
    driveSize: file.size ? Number(file.size) : 0,
    lastSyncedAt: new Date()
  };
}

export async function syncDriveFolder({ userId }) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const files = await listFilesInDriveFolder(folderId);

  const results = {
    totalFound: files.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0
  };

  await IngestionLog.create({
    action: "sync_drive_folder",
    status: "info",
    message: `Started Google Drive folder sync. Found ${files.length} files.`,
    createdBy: userId,
    metadata: {
      folderId,
      totalFound: files.length
    }
  });

  for (const file of files) {
    try {
      const mappedDocument = mapDriveFileToDocument(file);

      const existingDocument = await Document.findOne({
        driveFileId: file.id
      });

      if (!existingDocument) {
        const createdDocument = await Document.create({
          ...mappedDocument,
          status: "pending"
        });

        results.created += 1;

        await IngestionLog.create({
          action: "document_created",
          status: "success",
          message: `Created document metadata for ${file.name}`,
          documentId: createdDocument._id,
          driveFileId: file.id,
          createdBy: userId,
          metadata: {
            fileName: file.name
          }
        });

        continue;
      }

      const driveModifiedTime = mappedDocument.driveModifiedTime;
      const existingModifiedTime = existingDocument.driveModifiedTime;

      const hasChanged =
        driveModifiedTime &&
        (!existingModifiedTime || driveModifiedTime > existingModifiedTime);

      if (!hasChanged) {
        existingDocument.lastSyncedAt = new Date();
        await existingDocument.save();

        results.skipped += 1;

        await IngestionLog.create({
          action: "document_skipped",
          status: "info",
          message: `Skipped unchanged document ${file.name}`,
          documentId: existingDocument._id,
          driveFileId: file.id,
          createdBy: userId
        });

        continue;
      }

      existingDocument.title = mappedDocument.title;
      existingDocument.fileName = mappedDocument.fileName;
      existingDocument.fileType = mappedDocument.fileType;
      existingDocument.sourceType = mappedDocument.sourceType;
      existingDocument.driveMimeType = mappedDocument.driveMimeType;
      existingDocument.driveModifiedTime = mappedDocument.driveModifiedTime;
      existingDocument.driveSize = mappedDocument.driveSize;
      existingDocument.lastSyncedAt = new Date();
      existingDocument.status = "pending";
      existingDocument.errorMessage = "";
      existingDocument.totalChunks = 0;
      existingDocument.totalTokens = 0;
      existingDocument.indexedAt = null;

      await existingDocument.save();

      await SourceChunk.deleteMany({
        documentId: existingDocument._id
      });

      results.updated += 1;

      await IngestionLog.create({
        action: "document_updated",
        status: "success",
        message: `Updated document metadata for ${file.name}`,
        documentId: existingDocument._id,
        driveFileId: file.id,
        createdBy: userId
      });
    } catch (error) {
      results.failed += 1;

      await IngestionLog.create({
        action: "document_failed",
        status: "failed",
        message: `Failed to sync ${file.name}: ${error.message}`,
        driveFileId: file.id,
        createdBy: userId,
        metadata: {
          error: error.message
        }
      });
    }
  }

  await IngestionLog.create({
    action: "sync_drive_folder",
    status: "success",
    message: `Completed Google Drive folder sync. Created ${results.created}, updated ${results.updated}, skipped ${results.skipped}, failed ${results.failed}.`,
    createdBy: userId,
    metadata: results
  });

  return results;
}

export async function processPendingDocuments({ userId, limit = 3 }) {
  const safeLimit = Math.min(Number(limit) || 3, 10);

  const documents = await Document.find({
    status: "pending",
    isActive: true,
    fileType: "pdf"
  })
    .sort({ createdAt: 1 })
    .limit(safeLimit);

  const results = {
    totalSelected: documents.length,
    indexed: 0,
    failed: 0,
    skipped: 0
  };

  await IngestionLog.create({
    action: "process_documents",
    status: "info",
    message: `Started processing ${documents.length} pending PDF document(s).`,
    createdBy: userId,
    metadata: {
      limit: safeLimit
    }
  });

  for (const document of documents) {
    try {
      document.status = "processing";
      document.errorMessage = "";
      await document.save();

      await IngestionLog.create({
        action: "document_processing_started",
        status: "info",
        message: `Started text extraction for ${document.fileName}`,
        documentId: document._id,
        driveFileId: document.driveFileId,
        createdBy: userId
      });

      const pdfBuffer = await downloadDriveFileAsBuffer(document.driveFileId);
      const extraction = await extractTextFromPdfBuffer(pdfBuffer);

      if (!extraction.text || extraction.text.length < 100) {
        throw new Error(
          "No usable text was extracted. This may be a scanned PDF."
        );
      }

      const chunks = splitTextIntoChunks(extraction.text, {
        chunkSize: 3000,
        overlapSize: 350
      });

      if (chunks.length === 0) {
        throw new Error("Text extraction succeeded, but no chunks were created");
      }

      await SourceChunk.deleteMany({
        documentId: document._id
      });

      const chunkDocuments = chunks.map((chunk) => ({
        documentId: document._id,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        pageStart: null,
        pageEnd: null,
        chapter: "",
        sectionTitle: "",
        vectorId: "",
        embeddingStatus: "pending",
        embeddingModel: "",
        embeddingDimensions: 0,
        embeddingError: "",
        embeddedAt: null
      }));

      await SourceChunk.insertMany(chunkDocuments);

      const totalTokens = chunks.reduce(
        (sum, chunk) => sum + chunk.tokenCount,
        0
      );

      document.status = "indexed";
      document.totalChunks = chunks.length;
      document.totalTokens = totalTokens;
      document.errorMessage = "";
      document.indexedAt = new Date();

      await document.save();

      results.indexed += 1;

      await IngestionLog.create({
        action: "document_indexed",
        status: "success",
        message: `Indexed ${document.fileName}. Created ${chunks.length} chunk(s).`,
        documentId: document._id,
        driveFileId: document.driveFileId,
        createdBy: userId,
        metadata: {
          pageCount: extraction.pageCount,
          totalChunks: chunks.length,
          totalTokens
        }
      });
    } catch (error) {
      document.status = "failed";
      document.errorMessage = error.message;
      await document.save();

      results.failed += 1;

      await IngestionLog.create({
        action: "document_processing_failed",
        status: "failed",
        message: `Failed to process ${document.fileName}: ${error.message}`,
        documentId: document._id,
        driveFileId: document.driveFileId,
        createdBy: userId,
        metadata: {
          error: error.message
        }
      });
    }
  }

  await IngestionLog.create({
    action: "process_documents",
    status: "success",
    message: `Completed document processing. Indexed ${results.indexed}, failed ${results.failed}, skipped ${results.skipped}.`,
    createdBy: userId,
    metadata: results
  });

  return results;
}

export async function getDocuments({ page = 1, limit = 20, status }) {
  const query = {};

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [documents, total, statusCounts] = await Promise.all([
    Document.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Document.countDocuments(query),
    Document.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const counts = {
    total: 0,
    pending: 0,
    processing: 0,
    indexed: 0,
    failed: 0,
    disabled: 0
  };

  for (const item of statusCounts) {
    counts[item._id] = item.count;
    counts.total += item.count;
  }

  return {
    documents,
    counts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getDocumentById(documentId) {
  return Document.findById(documentId);
}

export async function disableDocument(documentId) {
  const document = await Document.findById(documentId);

  if (!document) {
    return null;
  }

  document.status = "disabled";
  document.isActive = false;
  await document.save();

  return document;
}

export async function resetFailedDocuments({ userId }) {
  const failedDocuments = await Document.find({
    status: "failed",
    isActive: true
  });

  for (const document of failedDocuments) {
    await SourceChunk.deleteMany({
      documentId: document._id
    });
  }

  const result = await Document.updateMany(
    {
      status: "failed",
      isActive: true
    },
    {
      $set: {
        status: "pending",
        errorMessage: "",
        totalChunks: 0,
        totalTokens: 0,
        indexedAt: null
      }
    }
  );

  await IngestionLog.create({
    action: "process_documents",
    status: "info",
    message: `Reset ${result.modifiedCount} failed document(s) back to pending.`,
    createdBy: userId,
    metadata: {
      resetCount: result.modifiedCount
    }
  });

  return {
    resetCount: result.modifiedCount
  };
}

export async function getIngestionLogs({ limit = 30 }) {
  return IngestionLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("createdBy", "name email role");
}