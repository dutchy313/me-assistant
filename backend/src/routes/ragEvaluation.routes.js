import express from "express";
import {
  evaluateSnapshot,
  evaluateSnapshotsBatch,
  getEvaluationSnapshots,
  getEvaluationSummary,
  getEvaluations
} from "../controllers/ragEvaluation.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { evaluationRateLimiter } from "../middlewares/productionRateLimit.middleware.js";
import { enforceDailyEvaluationLimit } from "../middlewares/dailyUsageLimit.middleware.js";
import { validateBody } from "../middlewares/requestValidation.middleware.js";
import { evaluateSnapshotsBatchSchema } from "../validations/ragEvaluation.validation.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/summary", getEvaluationSummary);
router.get("/snapshots", getEvaluationSnapshots);

router.post(
  "/snapshots/evaluate-batch",
  evaluationRateLimiter,
  enforceDailyEvaluationLimit(),
  validateBody(evaluateSnapshotsBatchSchema),
  evaluateSnapshotsBatch
);

router.post(
  "/snapshots/:snapshotId/evaluate",
  evaluationRateLimiter,
  enforceDailyEvaluationLimit(),
  evaluateSnapshot
);

router.get("/", getEvaluations);

export default router;