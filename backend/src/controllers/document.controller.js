import { asyncHandler } from "../utils/asyncHandler.js";
import {
  disableDocument,
  getDocumentById,
  getDocuments,
  getIngestionLogs,
  processPendingDocuments,
  reprocessDocument,
  resetFailedDocuments,
  suggestDocumentMetadata,
  suggestMetadataBatch,
  syncDriveFolder,
  updateDocumentMetadata
} from "../services/document.service.js";

export const syncDriveDocuments = asyncHandler(async (req, res) => {
  const result = await syncDriveFolder({
    userId: req.user._id
  });

  res.status(200).json({
    status: "success",
    message: "Google Drive folder sync completed",
    data: {
      result
    }
  });
});

export const processDocuments = asyncHandler(async (req, res) => {
  const limit = Number(req.body.limit || 3);

  const result = await processPendingDocuments({
    userId: req.user._id,
    limit
  });

  res.status(200).json({
    status: "success",
    message: "Document processing completed",
    data: {
      result
    }
  });
});

export const reprocessSingleDocument = asyncHandler(async (req, res) => {
  const result = await reprocessDocument({
    documentId: req.params.documentId,
    userId: req.user._id
  });

  if (!result) {
    return res.status(404).json({
      status: "fail",
      message: "Document not found"
    });
  }

  res.status(200).json({
    status: "success",
    message:
      "Document reprocessed. New chunks were created and must be embedded.",
    data: {
      result
    }
  });
});

export const resetFailedDocumentProcessing = asyncHandler(async (req, res) => {
  const result = await resetFailedDocuments({
    userId: req.user._id
  });

  res.status(200).json({
    status: "success",
    message: "Failed documents reset",
    data: {
      result
    }
  });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const status = req.query.status || "";
  const metadataStatus = req.query.metadataStatus || "";

  const result = await getDocuments({
    page,
    limit,
    status,
    metadataStatus
  });

  res.status(200).json({
    status: "success",
    data: result
  });
});

export const getSingleDocument = asyncHandler(async (req, res) => {
  const document = await getDocumentById(req.params.documentId);

  if (!document) {
    return res.status(404).json({
      status: "fail",
      message: "Document not found"
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      document
    }
  });
});

export const updateSingleDocumentMetadata = asyncHandler(async (req, res) => {
  const document = await updateDocumentMetadata(req.params.documentId, req.body);

  if (!document) {
    return res.status(404).json({
      status: "fail",
      message: "Document not found"
    });
  }

  res.status(200).json({
    status: "success",
    message: "Document metadata updated",
    data: {
      document
    }
  });
});

export const suggestSingleDocumentMetadata = asyncHandler(async (req, res) => {
  const result = await suggestDocumentMetadata(req.params.documentId);

  if (!result) {
    return res.status(404).json({
      status: "fail",
      message: "Document not found"
    });
  }

  res.status(200).json({
    status: "success",
    message: "Metadata suggestion generated",
    data: result
  });
});

export const suggestDocumentMetadataBatch = asyncHandler(async (req, res) => {
  const limit = Number(req.body.limit || 3);

  const result = await suggestMetadataBatch({
    userId: req.user._id,
    limit
  });

  res.status(200).json({
    status: "success",
    message: "Bulk metadata suggestion completed",
    data: {
      result
    }
  });
});

export const disableSingleDocument = asyncHandler(async (req, res) => {
  const document = await disableDocument(req.params.documentId);

  if (!document) {
    return res.status(404).json({
      status: "fail",
      message: "Document not found"
    });
  }

  res.status(200).json({
    status: "success",
    message: "Document disabled",
    data: {
      document
    }
  });
});

export const listIngestionLogs = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 30);

  const logs = await getIngestionLogs({
    limit
  });

  res.status(200).json({
    status: "success",
    data: {
      logs
    }
  });
});