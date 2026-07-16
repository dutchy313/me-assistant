import express from "express";
import {
  previewChunk,
  sourceQualitySummary,
  testRetrieval
} from "../controllers/retrieval.controller.js";
import {
  requireAuth,
  requireReviewerOrAdmin
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireReviewerOrAdmin);

router.post("/test", testRetrieval);
router.get("/source-quality", sourceQualitySummary);
router.get("/chunks/:chunkId", previewChunk);

export default router;