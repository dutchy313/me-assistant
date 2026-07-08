import mongoose from "mongoose";

const answerFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    rating: {
      type: String,
      enum: ["helpful", "not_helpful"],
      required: true
    },

    reasons: [
      {
        type: String,
        enum: [
          "not_accurate",
          "sources_not_relevant",
          "too_shallow",
          "too_long",
          "needed_example",
          "did_not_answer_question",
          "unclear_citation",
          "other"
        ]
      }
    ],

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },

    questionText: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ""
    },

    answerText: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const AnswerFeedback = mongoose.model(
  "AnswerFeedback",
  answerFeedbackSchema
);

export default AnswerFeedback;