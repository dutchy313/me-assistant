import mongoose from "mongoose";

const ragEvaluationSnapshotSchema = new mongoose.Schema(
  {
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

    originalQuestion: {
      type: String,
      required: true,
      trim: true
    },

    rewrittenQuestion: {
      type: String,
      trim: true,
      default: ""
    },

    answer: {
      type: String,
      required: true,
      trim: true
    },

    answerModel: {
      type: String,
      trim: true,
      default: ""
    },

    rewriteModel: {
      type: String,
      trim: true,
      default: ""
    },

    embeddingModel: {
      type: String,
      trim: true,
      default: ""
    },

    retrievalConfig: {
      topK: {
        type: Number,
        default: 5
      },

      candidateK: {
        type: Number,
        default: 20
      },

      minScore: {
        type: Number,
        default: 0.2
      },

      maxChunksPerDocument: {
        type: Number,
        default: 2
      }
    },

    retrievedChunks: {
      type: [
        {
          chunkId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SourceChunk",
            default: null
          },

          documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            default: null
          },

          documentTitle: {
            type: String,
            trim: true,
            default: ""
          },

          canonicalTitle: {
            type: String,
            trim: true,
            default: ""
          },

          citationLabel: {
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

          chunkIndex: {
            type: Number,
            default: 0
          },

          score: {
            type: Number,
            default: 0
          },

          selected: {
            type: Boolean,
            default: false
          },

          text: {
            type: String,
            required: true
          },

          excerpt: {
            type: String,
            trim: true,
            default: ""
          }
        }
      ],
      default: []
    },

    selectedContextText: {
      type: String,
      trim: true,
      default: ""
    },

    citations: {
      type: [
        {
          sourceNumber: {
            type: Number,
            required: true,
            min: 1
          },

          documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            default: null
          },

          chunkId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SourceChunk",
            default: null
          },

          documentTitle: {
            type: String,
            trim: true,
            default: ""
          },

          canonicalTitle: {
            type: String,
            trim: true,
            default: ""
          },

          citationLabel: {
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

          chunkIndex: {
            type: Number,
            default: 0
          },

          score: {
            type: Number,
            default: 0
          },

          excerpt: {
            type: String,
            trim: true,
            default: ""
          }
        }
      ],
      default: []
    },

    evaluationStatus: {
      type: String,
      enum: ["not_evaluated", "evaluating", "evaluated", "failed"],
      default: "not_evaluated",
      index: true
    },

    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RagEvaluation",
      default: null
    },

    errorMessage: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const RagEvaluationSnapshot = mongoose.model(
  "RagEvaluationSnapshot",
  ragEvaluationSnapshotSchema
);

export default RagEvaluationSnapshot;