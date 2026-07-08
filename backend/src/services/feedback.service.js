import AnswerFeedback from "../models/AnswerFeedback.js";
import SourceFeedback from "../models/SourceFeedback.js";
import SessionFeedback from "../models/SessionFeedback.js";
import ProductFeedback from "../models/ProductFeedback.js";

export async function createAnswerFeedback(userId, payload) {
  return AnswerFeedback.create({
    userId,
    ...payload
  });
}

export async function createSourceFeedback(userId, payload) {
  return SourceFeedback.create({
    userId,
    ...payload
  });
}

export async function createSessionFeedback(userId, payload) {
  return SessionFeedback.create({
    userId,
    ...payload
  });
}

export async function createProductFeedback(userId, payload) {
  return ProductFeedback.create({
    userId,
    ...payload
  });
}

export async function getFeedbackSummary() {
  const [
    totalAnswerFeedback,
    helpfulAnswers,
    notHelpfulAnswers,
    totalSourceFeedback,
    usefulSources,
    notUsefulSources,
    totalSessionFeedback,
    sessionsHelpedYes,
    sessionsHelpedPartly,
    sessionsHelpedNo,
    totalProductFeedback,
    productRatingStats,
    commonAnswerIssues,
    commonUserGoals
  ] = await Promise.all([
    AnswerFeedback.countDocuments(),
    AnswerFeedback.countDocuments({ rating: "helpful" }),
    AnswerFeedback.countDocuments({ rating: "not_helpful" }),

    SourceFeedback.countDocuments(),
    SourceFeedback.countDocuments({ rating: "useful" }),
    SourceFeedback.countDocuments({ rating: "not_useful" }),

    SessionFeedback.countDocuments(),
    SessionFeedback.countDocuments({ helpedProgress: "yes" }),
    SessionFeedback.countDocuments({ helpedProgress: "partly" }),
    SessionFeedback.countDocuments({ helpedProgress: "no" }),

    ProductFeedback.countDocuments(),

    ProductFeedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" }
        }
      }
    ]),

    AnswerFeedback.aggregate([
      { $unwind: "$reasons" },
      {
        $group: {
          _id: "$reasons",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),

    SessionFeedback.aggregate([
      {
        $group: {
          _id: "$userGoal",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ]);

  const answerHelpfulnessRate =
    totalAnswerFeedback === 0
      ? 0
      : Math.round((helpfulAnswers / totalAnswerFeedback) * 100);

  const sourceUsefulnessRate =
    totalSourceFeedback === 0
      ? 0
      : Math.round((usefulSources / totalSourceFeedback) * 100);

  const sessionSuccessRate =
    totalSessionFeedback === 0
      ? 0
      : Math.round((sessionsHelpedYes / totalSessionFeedback) * 100);

  return {
    totals: {
      totalAnswerFeedback,
      totalSourceFeedback,
      totalSessionFeedback,
      totalProductFeedback
    },

    answerFeedback: {
      helpfulAnswers,
      notHelpfulAnswers,
      helpfulnessRate: answerHelpfulnessRate
    },

    sourceFeedback: {
      usefulSources,
      notUsefulSources,
      usefulnessRate: sourceUsefulnessRate
    },

    sessionFeedback: {
      yes: sessionsHelpedYes,
      partly: sessionsHelpedPartly,
      no: sessionsHelpedNo,
      successRate: sessionSuccessRate
    },

    productFeedback: {
      averageRating: productRatingStats[0]?.averageRating
        ? Number(productRatingStats[0].averageRating.toFixed(1))
        : 0
    },

    commonAnswerIssues,
    commonUserGoals
  };
}

export async function getRecentFeedback(limit = 20) {
  const [answerFeedback, sourceFeedback, sessionFeedback, productFeedback] =
    await Promise.all([
      AnswerFeedback.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "name email role"),

      SourceFeedback.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "name email role"),

      SessionFeedback.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "name email role"),

      ProductFeedback.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "name email role")
    ]);

  return {
    answerFeedback,
    sourceFeedback,
    sessionFeedback,
    productFeedback
  };
}