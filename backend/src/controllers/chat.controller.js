import { asyncHandler } from "../utils/asyncHandler.js";
import {
  askChatQuestion,
  getChatMessages,
  getChatSessions
} from "../services/chat.service.js";

export const askQuestion = asyncHandler(async (req, res) => {
  const result = await askChatQuestion({
    userId: req.user._id,
    sessionId: req.body.sessionId,
    question: req.body.question
  });

  res.status(200).json({
    status: "success",
    message: "Question answered",
    data: result
  });
});

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await getChatSessions(req.user._id);

  res.status(200).json({
    status: "success",
    data: {
      sessions
    }
  });
});

export const listMessages = asyncHandler(async (req, res) => {
  const result = await getChatMessages({
    userId: req.user._id,
    sessionId: req.params.sessionId
  });

  if (!result) {
    return res.status(404).json({
      status: "fail",
      message: "Chat session not found"
    });
  }

  res.status(200).json({
    status: "success",
    data: result
  });
});