import mongoose from "mongoose";

const sourceFeedbackSchema = new mongoose.Schema(
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

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    rating: {
      type: String,
      enum: ["useful", "not_useful"],
      required: true
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },

    sourceTitle: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },

    excerpt: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ""
    },

    retrievalScore: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const SourceFeedback = mongoose.model(
  "SourceFeedback",
  sourceFeedbackSchema
);

export default SourceFeedback;