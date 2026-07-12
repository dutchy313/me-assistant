import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createChatAnswer,
  getChatSessionWithMessages,
  listUserChatSessions
} from "../services/chat.service.js";

export const listChatSessions = asyncHandler(async (req, res) => {
  const sessions = await listUserChatSessions({
    userId: req.user._id
  });

  res.status(200).json({
    status: "success",
    data: {
      sessions
    }
  });
});

export const getChatSession = asyncHandler(async (req, res) => {
  const result = await getChatSessionWithMessages({
    sessionId: req.params.sessionId,
    userId: req.user._id
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

export const getChatSessionMessages = asyncHandler(async (req, res) => {
  const result = await getChatSessionWithMessages({
    sessionId: req.params.sessionId,
    userId: req.user._id
  });

  if (!result) {
    return res.status(404).json({
      status: "fail",
      message: "Chat session not found"
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      session: result.session,
      messages: result.messages
    }
  });
});

export const sendChatMessage = asyncHandler(async (req, res) => {
  const result = await createChatAnswer({
    userId: req.user._id,
    sessionId: req.body.sessionId || null,
    question: req.body.message || req.body.question
  });

  res.status(200).json({
    status: "success",
    message: "Answer generated",
    data: result
  });
});

export const askChatQuestion = asyncHandler(async (req, res) => {
  const result = await createChatAnswer({
    userId: req.user._id,
    sessionId: req.body.sessionId || null,
    question: req.body.message || req.body.question
  });

  res.status(200).json({
    status: "success",
    message: "Answer generated",
    data: result
  });
});

export const sendChatSessionMessage = asyncHandler(async (req, res) => {
  const result = await createChatAnswer({
    userId: req.user._id,
    sessionId: req.params.sessionId,
    question: req.body.message || req.body.question
  });

  res.status(200).json({
    status: "success",
    message: "Answer generated",
    data: result
  });
});