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
      default: "",
      index: true
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

    embeddingStatus: {
      type: String,
      enum: ["pending", "embedded", "failed"],
      default: "pending",
      index: true
    },

    embeddingModel: {
      type: String,
      trim: true,
      default: ""
    },

    embeddingDimensions: {
      type: Number,
      default: 0
    },

    embeddingError: {
      type: String,
      trim: true,
      default: ""
    },

    embeddedAt: {
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

sourceChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });
sourceChunkSchema.index({ embeddingStatus: 1, isActive: 1 });

const SourceChunk = mongoose.model("SourceChunk", sourceChunkSchema);

export default SourceChunk;