import express from "express";
import {
  evaluateSnapshot,
  evaluateSnapshotsBatch,
  getEvaluation,
  getEvaluationSnapshots,
  getEvaluationSummary,
  getEvaluations,
  reviewEvaluation
} from "../controllers/ragEvaluation.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { evaluationRateLimiter } from "../middlewares/productionRateLimit.middleware.js";
import { enforceDailyEvaluationLimit } from "../middlewares/dailyUsageLimit.middleware.js";
import {
  validateBody,
  validateQuery
} from "../middlewares/requestValidation.middleware.js";
import {
  evaluateSnapshotsBatchSchema,
  evaluationSnapshotsQuerySchema,
  ragEvaluationsQuerySchema,
  reviewEvaluationSchema
} from "../validations/ragEvaluation.validation.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/summary", getEvaluationSummary);

router.get(
  "/snapshots",
  validateQuery(evaluationSnapshotsQuerySchema),
  getEvaluationSnapshots
);

router.post(
  "/snapshots/evaluate-batch",
  evaluationRateLimiter,
  validateBody(evaluateSnapshotsBatchSchema),
  enforceDailyEvaluationLimit((req) => req.body.limit),
  evaluateSnapshotsBatch
);

router.post(
  "/snapshots/:snapshotId/evaluate",
  evaluationRateLimiter,
  enforceDailyEvaluationLimit(),
  evaluateSnapshot
);

router.get("/", validateQuery(ragEvaluationsQuerySchema), getEvaluations);

router.get("/:evaluationId", getEvaluation);

router.patch(
  "/:evaluationId/review",
  validateBody(reviewEvaluationSchema),
  reviewEvaluation
);

export default router;