import Document from "../models/Document.js";
import IngestionLog from "../models/IngestionLog.js";
import { listFilesInDriveFolder } from "./googleDrive.service.js";

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

      await existingDocument.save();

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

export async function getDocuments({ page = 1, limit = 20, status }) {
  const query = {};

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [documents, total] = await Promise.all([
    Document.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Document.countDocuments(query)
  ]);

  return {
    documents,
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

export async function getIngestionLogs({ limit = 30 }) {
  return IngestionLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("createdBy", "name email role");
}