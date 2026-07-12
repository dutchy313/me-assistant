import { asyncHandler } from "../utils/asyncHandler.js";
import {
  evaluatePendingRagSnapshots,
  evaluateRagSnapshot,
  getRagEvaluationSummary,
  listEvaluationSnapshots,
  listRagEvaluations
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
    limit: Number(req.query.limit || 20)
  });

  res.status(200).json({
    status: "success",
    data: result
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

  res.status(200).json({
    status: "success",
    message: result.alreadyEvaluated
      ? "Snapshot was already evaluated"
      : "Snapshot evaluated successfully",
    data: result
  });
});

export const evaluateSnapshotsBatch = asyncHandler(async (req, res) => {
  const result = await evaluatePendingRagSnapshots({
    userId: req.user._id,
    limit: Number(req.body.limit || 3)
  });

  res.status(200).json({
    status: "success",
    message: "Batch evaluation completed",
    data: {
      result
    }
  });
});