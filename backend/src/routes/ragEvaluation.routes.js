import express from "express";
import {
  evaluateSnapshot,
  getEvaluationSnapshots,
  getEvaluationSummary,
  getEvaluations
} from "../controllers/ragEvaluation.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/summary", getEvaluationSummary);
router.get("/snapshots", getEvaluationSnapshots);
router.get("/", getEvaluations);
router.post("/snapshots/:snapshotId/evaluate", evaluateSnapshot);

export default router;