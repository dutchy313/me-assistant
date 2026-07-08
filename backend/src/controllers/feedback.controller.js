import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createAnswerFeedback,
  createProductFeedback,
  createSessionFeedback,
  createSourceFeedback,
  getFeedbackSummary,
  getRecentFeedback
} from "../services/feedback.service.js";

export const submitAnswerFeedback = asyncHandler(async (req, res) => {
  const feedback = await createAnswerFeedback(req.user._id, req.body);

  res.status(201).json({
    status: "success",
    message: "Answer feedback submitted",
    data: {
      feedback
    }
  });
});

export const submitSourceFeedback = asyncHandler(async (req, res) => {
  const feedback = await createSourceFeedback(req.user._id, req.body);

  res.status(201).json({
    status: "success",
    message: "Source feedback submitted",
    data: {
      feedback
    }
  });
});

export const submitSessionFeedback = asyncHandler(async (req, res) => {
  const feedback = await createSessionFeedback(req.user._id, req.body);

  res.status(201).json({
    status: "success",
    message: "Session feedback submitted",
    data: {
      feedback
    }
  });
});

export const submitProductFeedback = asyncHandler(async (req, res) => {
  const feedback = await createProductFeedback(req.user._id, req.body);

  res.status(201).json({
    status: "success",
    message: "Product feedback submitted",
    data: {
      feedback
    }
  });
});

export const feedbackSummary = asyncHandler(async (req, res) => {
  const summary = await getFeedbackSummary();

  res.status(200).json({
    status: "success",
    data: {
      summary
    }
  });
});

export const recentFeedback = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 20);
  const feedback = await getRecentFeedback(limit);

  res.status(200).json({
    status: "success",
    data: {
      feedback
    }
  });
});