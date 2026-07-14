import { asyncHandler } from "../utils/asyncHandler.js";
import { incrementDailyUsage } from "../middlewares/dailyUsageLimit.middleware.js";
import {
  evaluatePendingRagSnapshots,
  evaluateRagSnapshot,
  getRagEvaluationSummary,
  getSingleRagEvaluation,
  listEvaluationSnapshots,
  listRagEvaluations,
  markRagEvaluationReviewed
} from "../services/ragEvaluation.service.js";

export const getEvaluationSnapshots = asyncHandler(async (req, res) => {
  const result = await listEvaluationSnapshots({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20),
    evaluationStatus: req.query.evaluationStatus || ""
  });

  res.status(200).json({
    status: "success",
    data: result
  });
});

export const getEvaluations = asyncHandler(async (req, res) => {
  const result = await listRagEvaluations({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20),
    reviewStatus: req.query.reviewStatus || "",
    recommendedAction: req.query.recommendedAction || "",
    reviewDecision: req.query.reviewDecision || "",
    maxOverallScore: req.query.maxOverallScore || "",
    minOverallScore: req.query.minOverallScore || ""
  });

  res.status(200).json({
    status: "success",
    data: result
  });
});

export const getEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await getSingleRagEvaluation({
    evaluationId: req.params.evaluationId
  });

  if (!evaluation) {
    return res.status(404).json({
      status: "fail",
      message: "RAG evaluation not found"
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      evaluation
    }
  });
});

export const getEvaluationSummary = asyncHandler(async (req, res) => {
  const result = await getRagEvaluationSummary();

  res.status(200).json({
    status: "success",
    data: result
  });
});

export const evaluateSnapshot = asyncHandler(async (req, res) => {
  const result = await evaluateRagSnapshot({
    snapshotId: req.params.snapshotId,
    userId: req.user._id
  });

  if (!result) {
    return res.status(404).json({
      status: "fail",
      message: "RAG evaluation snapshot not found"
    });
  }

  await incrementDailyUsage(req, 1);

  res.status(200).json({
    status: "success",
    message: result.alreadyEvaluated
      ? "Snapshot was already evaluated"
      : "Snapshot evaluated successfully",
    data: result
  });
});

export const evaluateSnapshotsBatch = asyncHandler(async (req, res) => {
  const limit = Number(req.body.limit || 3);

  const result = await evaluatePendingRagSnapshots({
    userId: req.user._id,
    limit
  });

  await incrementDailyUsage(req, result.evaluated + result.alreadyEvaluated);

  res.status(200).json({
    status: "success",
    message: "Batch evaluation completed",
    data: {
      result
    }
  });
});

export const reviewEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await markRagEvaluationReviewed({
    evaluationId: req.params.evaluationId,
    adminUserId: req.user._id,
    reviewDecision: req.body.reviewDecision,
    reviewNote: req.body.reviewNote
  });

  if (!evaluation) {
    return res.status(404).json({
      status: "fail",
      message: "RAG evaluation not found"
    });
  }

  res.status(200).json({
    status: "success",
    message: "Evaluation review saved",
    data: {
      evaluation
    }
  });
});