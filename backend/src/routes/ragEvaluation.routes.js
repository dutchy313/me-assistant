import express from "express";
import {
  evaluateSnapshot,
  evaluateSnapshotsBatch,
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

/*
  Important:
  This batch route must come before /snapshots/:snapshotId/evaluate,
  otherwise Express may treat "evaluate-batch" as a snapshotId.
*/
router.post("/snapshots/evaluate-batch", evaluateSnapshotsBatch);

router.post("/snapshots/:snapshotId/evaluate", evaluateSnapshot);

router.get("/", getEvaluations);

export default router;