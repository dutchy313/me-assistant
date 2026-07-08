import { asyncHandler } from "../utils/asyncHandler.js";
import {
  disableDocument,
  getDocumentById,
  getDocuments,
  getIngestionLogs,
  syncDriveFolder
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

export const listDocuments = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const status = req.query.status || "";

  const result = await getDocuments({
    page,
    limit,
    status
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