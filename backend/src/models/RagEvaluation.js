import mongoose from "mongoose";

const metricScoreSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    reason: {
      type: String,
      required: true,
      trim: true
    },

    evidence: {
      type: String,
      trim: true,
      default: ""
    },

    improvement: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    _id: false
  }
);

const ragEvaluationSchema = new mongoose.Schema(
  {
    snapshotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RagEvaluationSnapshot",
      required: true,
      unique: true,
      index: true
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true
    },

    userMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      required: true,
      index: true
    },

    assistantMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    evaluatorModel: {
      type: String,
      trim: true,
      default: ""
    },

    contextRelevance: {
      type: metricScoreSchema,
      required: true
    },

    contextSufficiency: {
      type: metricScoreSchema,
      required: true
    },

    answerRelevance: {
      type: metricScoreSchema,
      required: true
    },

    answerCorrectness: {
      type: metricScoreSchema,
      required: true
    },

    answerGroundedness: {
      type: metricScoreSchema,
      required: true
    },

    overallScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true
    },

    overallLabel: {
      type: String,
      enum: ["poor", "limited", "good", "very_good", "excellent"],
      required: true,
      index: true
    },

    summary: {
      type: String,
      required: true,
      trim: true
    },

    strengths: {
      type: [String],
      default: []
    },

    weaknesses: {
      type: [String],
      default: []
    },

    recommendedAction: {
      type: String,
      enum: [
        "accept",
        "review_answer",
        "improve_retrieval",
        "improve_sources",
        "needs_human_review"
      ],
      default: "review_answer",
      index: true
    },

    rawEvaluatorOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const RagEvaluation = mongoose.model("RagEvaluation", ragEvaluationSchema);

export default RagEvaluation;