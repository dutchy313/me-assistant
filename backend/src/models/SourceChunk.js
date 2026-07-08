import mongoose from "mongoose";

const sourceChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true
    },

    vectorId: {
      type: String,
      trim: true,
      default: ""
    },

    chunkIndex: {
      type: Number,
      required: true
    },

    text: {
      type: String,
      required: true
    },

    pageStart: {
      type: Number,
      default: null
    },

    pageEnd: {
      type: Number,
      default: null
    },

    chapter: {
      type: String,
      trim: true,
      default: ""
    },

    sectionTitle: {
      type: String,
      trim: true,
      default: ""
    },

    tokenCount: {
      type: Number,
      default: 0
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

sourceChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

const SourceChunk = mongoose.model("SourceChunk", sourceChunkSchema);

export default SourceChunk;