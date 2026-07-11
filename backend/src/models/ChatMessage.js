import mongoose from "mongoose";

const citationSchema = new mongoose.Schema(
  {
    sourceNumber: {
      type: Number,
      required: true
    },

    chunkId: {
      type: String,
      required: true
    },

    documentId: {
      type: String,
      default: ""
    },

    documentTitle: {
      type: String,
      default: ""
    },

    canonicalTitle: {
      type: String,
      default: ""
    },

    citationLabel: {
      type: String,
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
      default: ""
    },

    fileName: {
      type: String,
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
      default: ""
    }
  },
  {
    _id: false
  }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
      index: true
    },

    content: {
      type: String,
      required: true
    },

    citations: {
      type: [citationSchema],
      default: []
    },

    model: {
      type: String,
      default: ""
    },

    retrieval: {
      topK: {
        type: Number,
        default: 0
      },

      minScore: {
        type: Number,
        default: 0
      },

      resultCount: {
        type: Number,
        default: 0
      },

      originalQuestion: {
        type: String,
        default: ""
      },

      standaloneQuestion: {
        type: String,
        default: ""
      }
    }
  },
  {
    timestamps: true
  }
);

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;