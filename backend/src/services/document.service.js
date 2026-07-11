import OpenAI from "openai";
import Document from "../models/Document.js";
import SourceChunk from "../models/SourceChunk.js";
import IngestionLog from "../models/IngestionLog.js";
import {
  downloadDriveFileAsBuffer,
  listFilesInDriveFolder
} from "./googleDrive.service.js";
import { extractTextFromPdfBuffer } from "./pdfExtraction.service.js";
import { splitTextIntoChunks } from "./chunking.service.js";
import {
  createQdrantPointId,
  deleteChunkVectors
} from "./qdrant.service.js";

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

function getChatModel() {
  return process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";
}

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
          canonicalTitle: "",
          authors: [],
          publicationYear: null,
          publisher: "",
          citationLabel: "",
          metadataStatus: "auto",
          metadataNotes: "",
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

        if (!existingDocument.metadataStatus) {
          existingDocument.metadataStatus = "auto";
        }

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

      if (!existingDocument.metadataStatus) {
        existingDocument.metadataStatus = "auto";
      }

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
      await processSinglePdfDocument({
        document,
        userId,
        mode: "initial"
      });

      results.indexed += 1;
    } catch (error) {
      document.status = "failed";
      document.errorMessage = error.message;

      if (!document.metadataStatus) {
        document.metadataStatus = "auto";
      }

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

export async function reprocessDocument({ documentId, userId }) {
  const document = await Document.findById(documentId);

  if (!document) {
    return null;
  }

  if (!document.isActive) {
    throw new Error("This document is disabled and cannot be reprocessed");
  }

  if (document.fileType !== "pdf") {
    throw new Error("Only PDF documents can be reprocessed");
  }

  await IngestionLog.create({
    action: "process_documents",
    status: "info",
    message: `Started selected document reprocess for ${document.fileName}`,
    documentId: document._id,
    driveFileId: document.driveFileId,
    createdBy: userId,
    metadata: {
      mode: "selected_reprocess"
    }
  });

  try {
    const result = await processSinglePdfDocument({
      document,
      userId,
      mode: "reprocess"
    });

    await IngestionLog.create({
      action: "process_documents",
      status: "success",
      message: `Completed selected document reprocess for ${document.fileName}. Created ${result.totalChunks} cleaned chunk(s).`,
      documentId: document._id,
      driveFileId: document.driveFileId,
      createdBy: userId,
      metadata: result
    });

    return {
      document,
      ...result
    };
  } catch (error) {
    document.status = "failed";
    document.errorMessage = error.message;
    await document.save();

    await IngestionLog.create({
      action: "document_processing_failed",
      status: "failed",
      message: `Failed to reprocess ${document.fileName}: ${error.message}`,
      documentId: document._id,
      driveFileId: document.driveFileId,
      createdBy: userId,
      metadata: {
        mode: "selected_reprocess",
        error: error.message
      }
    });

    throw error;
  }
}

async function processSinglePdfDocument({ document, userId, mode }) {
  document.status = "processing";
  document.errorMessage = "";
  await document.save();

  await IngestionLog.create({
    action: "document_processing_started",
    status: "info",
    message:
      mode === "reprocess"
        ? `Started cleaned text re-extraction for ${document.fileName}`
        : `Started text extraction for ${document.fileName}`,
    documentId: document._id,
    driveFileId: document.driveFileId,
    createdBy: userId,
    metadata: {
      mode
    }
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

  if (mode === "reprocess") {
    const existingChunks = await SourceChunk.find({
      documentId: document._id
    }).select("_id vectorId");

    const pointIds = existingChunks.map((chunk) => {
      return chunk.vectorId || createQdrantPointId(chunk._id);
    });

    if (pointIds.length > 0) {
      await deleteChunkVectors(pointIds);
    }
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

  if (!document.metadataStatus) {
    document.metadataStatus = "auto";
  }

  await document.save();

  const result = {
    mode,
    pageCount: extraction.pageCount,
    rawTextLength: extraction.rawTextLength || 0,
    cleanedTextLength: extraction.cleanedTextLength || extraction.text.length,
    totalChunks: chunks.length,
    totalTokens,
    pendingEmbeddings: chunks.length,
    deletedOldVectors: mode === "reprocess" ? true : false
  };

  await IngestionLog.create({
    action: "document_indexed",
    status: "success",
    message:
      mode === "reprocess"
        ? `Reprocessed ${document.fileName}. Created ${chunks.length} cleaned chunk(s). Re-embedding is now required.`
        : `Indexed ${document.fileName}. Created ${chunks.length} chunk(s).`,
    documentId: document._id,
    driveFileId: document.driveFileId,
    createdBy: userId,
    metadata: result
  });

  return result;
}

export async function getDocuments({
  page = 1,
  limit = 20,
  status,
  metadataStatus
}) {
  const query = {};

  if (status) {
    query.status = status;
  }

  if (metadataStatus) {
    if (metadataStatus === "auto") {
      query.$or = [
        { metadataStatus: "auto" },
        { metadataStatus: { $exists: false } },
        { metadataStatus: null },
        { metadataStatus: "" }
      ];
    } else {
      query.metadataStatus = metadataStatus;
    }
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const total = await Document.countDocuments(query);

  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
  const requestedPage = Math.max(Number(page) || 1, 1);
  const safePage = Math.min(requestedPage, totalPages);
  const skip = (safePage - 1) * safeLimit;

  const [documents, statusCounts, metadataCounts] = await Promise.all([
    Document.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    Document.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    Document.aggregate([
      {
        $group: {
          _id: "$metadataStatus",
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
    disabled: 0,
    metadataAuto: 0,
    metadataNeedsReview: 0,
    metadataReviewed: 0
  };

  for (const item of statusCounts) {
    counts[item._id] = item.count;
    counts.total += item.count;
  }

  for (const item of metadataCounts) {
    if (item._id === "auto" || !item._id) {
      counts.metadataAuto += item.count;
    }

    if (item._id === "needs_review") {
      counts.metadataNeedsReview += item.count;
    }

    if (item._id === "reviewed") {
      counts.metadataReviewed += item.count;
    }
  }

  return {
    documents,
    counts,
    filters: {
      status: status || "",
      metadataStatus: metadataStatus || ""
    },
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages
    }
  };
}

export async function getDocumentById(documentId) {
  return Document.findById(documentId);
}

export async function updateDocumentMetadata(documentId, payload) {
  const document = await Document.findById(documentId);

  if (!document) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "canonicalTitle")) {
    document.canonicalTitle = payload.canonicalTitle || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "authors")) {
    document.authors = Array.isArray(payload.authors) ? payload.authors : [];
  }

  if (Object.prototype.hasOwnProperty.call(payload, "publicationYear")) {
    document.publicationYear = payload.publicationYear || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "publisher")) {
    document.publisher = payload.publisher || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "citationLabel")) {
    document.citationLabel = payload.citationLabel || "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "sourceType")) {
    document.sourceType = payload.sourceType || document.sourceType || "book";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "metadataStatus")) {
    document.metadataStatus = payload.metadataStatus || "reviewed";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "metadataNotes")) {
    document.metadataNotes = payload.metadataNotes || "";
  }

  await document.save();

  return document;
}

export async function suggestDocumentMetadata(documentId) {
  const document = await Document.findById(documentId);

  if (!document) {
    return null;
  }

  const suggestion = await createMetadataSuggestionForDocument(document);

  return {
    document,
    suggestion
  };
}

export async function suggestMetadataBatch({ userId, limit = 3 }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 3, 1), 5);

  const documents = await Document.find({
    isActive: true,
    $or: [
      { metadataStatus: "auto" },
      { metadataStatus: { $exists: false } },
      { metadataStatus: null },
      { metadataStatus: "" }
    ]
  })
    .sort({
      status: -1,
      totalChunks: -1,
      createdAt: 1
    })
    .limit(safeLimit);

  const results = {
    totalSelected: documents.length,
    suggested: 0,
    failed: 0,
    items: []
  };

  await IngestionLog.create({
    action: "metadata_suggest_batch",
    status: "info",
    message: `Started bulk metadata suggestion for ${documents.length} document(s).`,
    createdBy: userId,
    metadata: {
      limit: safeLimit
    }
  });

  for (const document of documents) {
    try {
      const suggestion = await createMetadataSuggestionForDocument(document);

      document.canonicalTitle = suggestion.canonicalTitle || document.title || "";
      document.authors = suggestion.authors || [];
      document.publicationYear = suggestion.publicationYear || null;
      document.publisher = suggestion.publisher || "";
      document.citationLabel = suggestion.citationLabel || "";
      document.sourceType =
        suggestion.sourceType || document.sourceType || "book";
      document.metadataStatus = "needs_review";
      document.metadataNotes = suggestion.notes
        ? `AI suggestion (${suggestion.confidence || "low"} confidence): ${
            suggestion.notes
          }`
        : `AI suggestion (${suggestion.confidence || "low"} confidence).`;

      await document.save();

      results.suggested += 1;
      results.items.push({
        documentId: document._id,
        fileName: document.fileName,
        title: document.title,
        canonicalTitle: document.canonicalTitle,
        citationLabel: document.citationLabel,
        confidence: suggestion.confidence,
        status: "suggested"
      });

      await IngestionLog.create({
        action: "metadata_suggested",
        status: "success",
        message: `Suggested metadata for ${document.fileName}`,
        documentId: document._id,
        driveFileId: document.driveFileId,
        createdBy: userId,
        metadata: {
          suggestion
        }
      });
    } catch (error) {
      results.failed += 1;
      results.items.push({
        documentId: document._id,
        fileName: document.fileName,
        title: document.title,
        status: "failed",
        error: error.message
      });

      await IngestionLog.create({
        action: "metadata_suggestion_failed",
        status: "failed",
        message: `Failed to suggest metadata for ${document.fileName}: ${error.message}`,
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
    action: "metadata_suggest_batch",
    status: "success",
    message: `Completed bulk metadata suggestion. Suggested ${results.suggested}, failed ${results.failed}.`,
    createdBy: userId,
    metadata: results
  });

  return results;
}

async function createMetadataSuggestionForDocument(document) {
  const chunks = await SourceChunk.find({
    documentId: document._id,
    isActive: true
  })
    .sort({ chunkIndex: 1 })
    .limit(3)
    .select("chunkIndex text");

  const chunkText = chunks
    .map((chunk) => {
      return `Chunk ${chunk.chunkIndex}:\n${truncateText(chunk.text, 2500)}`;
    })
    .join("\n\n---\n\n");

  const client = getOpenAIClient();
  const model = getChatModel();

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You extract bibliographic metadata for Monitoring and Evaluation source documents. Return only valid JSON. Do not wrap JSON in markdown. If you are unsure, use an empty string, empty array, or null. Do not invent metadata."
      },
      {
        role: "user",
        content: [
          "Suggest metadata for this document.",
          "",
          "Use the file name and extracted text. The extracted text may be messy.",
          "",
          "Return JSON with exactly these fields:",
          "{",
          '  "canonicalTitle": "string",',
          '  "authors": ["string"],',
          '  "publicationYear": 2009,',
          '  "publisher": "string",',
          '  "citationLabel": "string",',
          '  "sourceType": "book|manual|guide|report|web|other",',
          '  "confidence": "high|medium|low",',
          '  "notes": "string"',
          "}",
          "",
          `Current title: ${document.title}`,
          `File name: ${document.fileName}`,
          `Current source type: ${document.sourceType}`,
          `Document processing status: ${document.status}`,
          "",
          "Extracted text sample:",
          chunkText || "No extracted text available."
        ].join("\n")
      }
    ],
    temperature: 0
  });

  const rawText = response.output_text || "";
  const parsed = parseJsonObject(rawText);

  return normalizeMetadataSuggestion({
    ...parsed,
    sourceType: parsed.sourceType || document.sourceType || "book"
  });
}

function normalizeMetadataSuggestion(value = {}) {
  const allowedSourceTypes = new Set([
    "book",
    "manual",
    "guide",
    "report",
    "web",
    "other"
  ]);

  return {
    canonicalTitle:
      typeof value.canonicalTitle === "string"
        ? value.canonicalTitle.trim()
        : "",

    authors: Array.isArray(value.authors)
      ? value.authors.map((author) => String(author).trim()).filter(Boolean)
      : [],

    publicationYear:
      typeof value.publicationYear === "number" ? value.publicationYear : null,

    publisher:
      typeof value.publisher === "string" ? value.publisher.trim() : "",

    citationLabel:
      typeof value.citationLabel === "string"
        ? value.citationLabel.trim()
        : "",

    sourceType: allowedSourceTypes.has(value.sourceType)
      ? value.sourceType
      : "book",

    confidence: ["high", "medium", "low"].includes(value.confidence)
      ? value.confidence
      : "low",

    notes: typeof value.notes === "string" ? value.notes.trim() : ""
  };
}

function parseJsonObject(text = "") {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("AI did not return valid metadata JSON");
    }

    return JSON.parse(match[0]);
  }
}

function truncateText(text = "", maxLength = 2500) {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength)}...`;
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