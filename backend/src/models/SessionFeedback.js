import mongoose from "mongoose";

const sessionFeedbackSchema = new mongoose.Schema(
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

    helpedProgress: {
      type: String,
      enum: ["yes", "partly", "no"],
      required: true
    },

    userGoal: {
      type: String,
      enum: [
        "understand_concept",
        "design_indicators",
        "build_logframe",
        "prepare_report",
        "plan_evaluation",
        "develop_theory_of_change",
        "review_proposal",
        "learning_research",
        "other"
      ],
      required: true
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const SessionFeedback = mongoose.model(
  "SessionFeedback",
  sessionFeedbackSchema
);

export default SessionFeedback;