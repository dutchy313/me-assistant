import {
  evaluatePendingRagSnapshots,
  evaluateRagSnapshot,
  getRagEvaluationSummary,
  getSingleRagEvaluation,
  listEvaluationSnapshots,
  listRagEvaluations,
  markRagEvaluationReviewed
} from "../services/ragEvaluation.service.js";
import { incrementDailyUsage } from "../middlewares/dailyUsageLimit.middleware.js";

function getValidatedQuery(req) {
  return req.validatedQuery || req.query || {};
}

export async function getEvaluationSnapshots(req, res, next) {
  try {
    const query = getValidatedQuery(req);

    const result = await listEvaluationSnapshots({
      page: query.page,
      limit: query.limit,
      evaluationStatus: query.evaluationStatus
    });

    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getEvaluations(req, res, next) {
  try {
    const query = getValidatedQuery(req);

    const result = await listRagEvaluations({
      page: query.page,
      limit: query.limit,
      reviewStatus: query.reviewStatus,
      recommendedAction: query.recommendedAction,
      reviewDecision: query.reviewDecision,
      minOverallScore: query.minOverallScore,
      maxOverallScore: query.maxOverallScore
    });

    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getEvaluation(req, res, next) {
  try {
    const evaluation = await getSingleRagEvaluation({
      evaluationId: req.params.evaluationId
    });

    res.status(200).json({
      status: "success",
      data: {
        evaluation
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getEvaluationSummary(req, res, next) {
  try {
    const summary = await getRagEvaluationSummary();

    res.status(200).json({
      status: "success",
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

export async function evaluateSnapshot(req, res, next) {
  try {
    const evaluation = await evaluateRagSnapshot({
      snapshotId: req.params.snapshotId,
      userId: req.user._id
    });

    await incrementDailyUsage(req, 1);

    res.status(201).json({
      status: "success",
      data: {
        evaluation
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function evaluateSnapshotsBatch(req, res, next) {
  try {
    const result = await evaluatePendingRagSnapshots({
      userId: req.user._id,
      limit: req.body.limit
    });

    const actualUsage = result.evaluated + result.alreadyEvaluated;
    await incrementDailyUsage(req, actualUsage);

    res.status(201).json({
      status: "success",
      data: {
        result
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewEvaluation(req, res, next) {
  try {
    const evaluation = await markRagEvaluationReviewed({
      evaluationId: req.params.evaluationId,
      adminUserId: req.user._id,
      reviewDecision: req.body.reviewDecision,
      reviewNote: req.body.reviewNote
    });

    res.status(200).json({
      status: "success",
      data: {
        evaluation
      }
    });
  } catch (error) {
    next(error);
  }
}