import mongoose from "mongoose";

const ingestionLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "sync_drive_folder",
        "document_created",
        "document_updated",
        "document_skipped",
        "document_failed"
      ],
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["success", "failed", "info"],
      default: "info",
      index: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null
    },

    driveFileId: {
      type: String,
      trim: true,
      default: ""
    },

    metadata: {
      type: Object,
      default: {}
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

const IngestionLog = mongoose.model("IngestionLog", ingestionLogSchema);

export default IngestionLog;