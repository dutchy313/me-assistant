import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    canonicalTitle: {
      type: String,
      trim: true,
      default: ""
    },

    author: {
      type: String,
      trim: true,
      default: ""
    },

    authors: {
      type: [String],
      default: []
    },

    publicationYear: {
      type: Number,
      default: null
    },

    publisher: {
      type: String,
      trim: true,
      default: ""
    },

    citationLabel: {
      type: String,
      trim: true,
      default: ""
    },

    metadataStatus: {
      type: String,
      enum: ["auto", "needs_review", "reviewed"],
      default: "auto",
      index: true
    },

    metadataNotes: {
      type: String,
      trim: true,
      default: ""
    },

    fileName: {
      type: String,
      required: true,
      trim: true
    },

    fileType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },

    sourceType: {
      type: String,
      enum: ["book", "manual", "guide", "report", "web", "other"],
      default: "book",
      index: true
    },

    driveFileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },

    driveMimeType: {
      type: String,
      trim: true,
      default: ""
    },

    driveModifiedTime: {
      type: Date,
      default: null
    },

    driveSize: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["pending", "processing", "indexed", "failed", "disabled"],
      default: "pending",
      index: true
    },

    totalChunks: {
      type: Number,
      default: 0
    },

    totalTokens: {
      type: Number,
      default: 0
    },

    errorMessage: {
      type: String,
      trim: true,
      default: ""
    },

    lastSyncedAt: {
      type: Date,
      default: null
    },

    indexedAt: {
      type: Date,
      default: null
    },

    ocrStatus: {
      type: String,
      enum: [
        "not_required",
        "needed",
        "queued",
        "processing",
        "completed",
        "failed",
        "skipped"
      ],
      default: "not_required",
      index: true
    },

    ocrReason: {
      type: String,
      trim: true,
      default: ""
    },

    ocrPreparedAt: {
      type: Date,
      default: null
    },

    ocrProcessedAt: {
      type: Date,
      default: null
    },

    ocrProvider: {
      type: String,
      trim: true,
      default: ""
    },

    ocrPageCount: {
      type: Number,
      default: 0
    },

    ocrTextLength: {
      type: Number,
      default: 0
    },

    ocrErrorMessage: {
      type: String,
      trim: true,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const Document = mongoose.model("Document", documentSchema);

export default Document;