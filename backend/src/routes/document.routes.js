import express from "express";
import {
  disableSingleDocument,
  getSingleDocument,
  listDocuments,
  listIngestionLogs,
  processDocuments,
  resetFailedDocumentProcessing,
  syncDriveDocuments
} from "../controllers/document.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.post("/sync-drive", syncDriveDocuments);
router.post("/process", processDocuments);
router.post("/reset-failed", resetFailedDocumentProcessing);

router.get("/", listDocuments);
router.get("/logs", listIngestionLogs);
router.get("/:documentId", getSingleDocument);
router.patch("/:documentId/disable", disableSingleDocument);

export default router;