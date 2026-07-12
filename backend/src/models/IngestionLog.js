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
        "document_failed",
        "process_documents",
        "document_processing_started",
        "document_indexed",
        "document_processing_failed",
        "prepare_qdrant_collection",
        "embed_chunks",
        "chunk_embedded",
        "chunk_embedding_failed",
        "metadata_suggest_batch",
        "metadata_suggested",
        "metadata_suggestion_failed",
        "prepare_ocr_queue",
        "ocr_needed_marked",
        "ocr_not_required_marked",
        "ocr_processing_started",
        "ocr_completed",
        "ocr_failed"
      ],
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["info", "success", "failed"],
      required: true,
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
      default: null,
      index: true
    },

    driveFileId: {
      type: String,
      trim: true,
      default: ""
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const IngestionLog = mongoose.model("IngestionLog", ingestionLogSchema);

export default IngestionLog;