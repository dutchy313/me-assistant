import express from "express";
import {
  feedbackSummary,
  recentFeedback,
  submitAnswerFeedback,
  submitProductFeedback,
  submitSessionFeedback,
  submitSourceFeedback
} from "../controllers/feedback.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  answerFeedbackSchema,
  productFeedbackSchema,
  sessionFeedbackSchema,
  sourceFeedbackSchema
} from "../validations/feedback.validation.js";

const router = express.Router();

router.post(
  "/answers",
  requireAuth,
  validate(answerFeedbackSchema),
  submitAnswerFeedback
);

router.post(
  "/sources",
  requireAuth,
  validate(sourceFeedbackSchema),
  submitSourceFeedback
);

router.post(
  "/sessions",
  requireAuth,
  validate(sessionFeedbackSchema),
  submitSessionFeedback
);

router.post(
  "/product",
  requireAuth,
  validate(productFeedbackSchema),
  submitProductFeedback
);

router.get("/summary", requireAuth, requireAdmin, feedbackSummary);
router.get("/recent", requireAuth, requireAdmin, recentFeedback);

export default router;