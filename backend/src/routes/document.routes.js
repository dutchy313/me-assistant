import express from "express";
import {
  disableSingleDocument,
  getSingleDocument,
  listDocuments,
  listIngestionLogs,
  processDocuments,
  reprocessSingleDocument,
  resetFailedDocumentProcessing,
  suggestDocumentMetadataBatch,
  suggestSingleDocumentMetadata,
  syncDriveDocuments,
  updateSingleDocumentMetadata
} from "../controllers/document.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateDocumentMetadataSchema } from "../validations/document.validation.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.post("/sync-drive", syncDriveDocuments);
router.post("/process", processDocuments);
router.post("/reset-failed", resetFailedDocumentProcessing);

router.get("/", listDocuments);
router.get("/logs", listIngestionLogs);

router.post("/suggest-metadata-batch", suggestDocumentMetadataBatch);

router.get("/:documentId", getSingleDocument);

router.post("/:documentId/reprocess", reprocessSingleDocument);
router.post("/:documentId/suggest-metadata", suggestSingleDocumentMetadata);

router.patch(
  "/:documentId/metadata",
  validate(updateDocumentMetadataSchema),
  updateSingleDocumentMetadata
);

router.patch("/:documentId/disable", disableSingleDocument);

export default router;