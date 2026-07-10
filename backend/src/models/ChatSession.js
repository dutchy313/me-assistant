import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      trim: true,
      default: "New M&E chat"
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;