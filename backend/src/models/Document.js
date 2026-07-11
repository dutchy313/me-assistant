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

    authors: [
      {
        type: String,
        trim: true
      }
    ],

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

    author: {
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
      trim: true,
      default: ""
    },

    sourceType: {
      type: String,
      enum: ["book", "manual", "guide", "report", "web", "other"],
      default: "book"
    },

    driveFileId: {
      type: String,
      required: true,
      unique: true
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

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Document = mongoose.model("Document", documentSchema);

export default Document;