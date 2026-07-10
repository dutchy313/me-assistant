import ChatSession from "../models/ChatSession.js";
import ChatMessage from "../models/ChatMessage.js";
import { answerQuestionWithRag } from "./rag.service.js";

function createSessionTitle(question) {
  const clean = question.trim();

  if (clean.length <= 60) {
    return clean;
  }

  return `${clean.slice(0, 60)}...`;
}

export async function askChatQuestion({ userId, sessionId, question }) {
  let session = null;

  if (sessionId) {
    session = await ChatSession.findOne({
      _id: sessionId,
      userId,
      isArchived: false
    });
  }

  if (!session) {
    session = await ChatSession.create({
      userId,
      title: createSessionTitle(question),
      lastMessageAt: new Date()
    });
  }

  const conversationMessages = await getRecentConversationMessages({
    userId,
    sessionId: session._id,
    limit: 8
  });

  const userMessage = await ChatMessage.create({
    sessionId: session._id,
    userId,
    role: "user",
    content: question
  });

  const ragResult = await answerQuestionWithRag({
    question,
    conversationMessages
  });

  const assistantMessage = await ChatMessage.create({
    sessionId: session._id,
    userId,
    role: "assistant",
    content: ragResult.answer,
    citations: ragResult.citations,
    model: ragResult.model,
    retrieval: ragResult.retrieval
  });

  session.lastMessageAt = new Date();
  await session.save();

  return {
    session,
    userMessage,
    assistantMessage
  };
}

export async function getChatSessions(userId) {
  return ChatSession.find({
    userId,
    isArchived: false
  })
    .sort({ lastMessageAt: -1 })
    .limit(30);
}

export async function getChatMessages({ userId, sessionId }) {
  const session = await ChatSession.findOne({
    _id: sessionId,
    userId,
    isArchived: false
  });

  if (!session) {
    return null;
  }

  const messages = await ChatMessage.find({
    sessionId,
    userId
  }).sort({ createdAt: 1 });

  return {
    session,
    messages
  };
}

async function getRecentConversationMessages({ userId, sessionId, limit = 8 }) {
  const messages = await ChatMessage.find({
    userId,
    sessionId
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("role content createdAt");

  return messages.reverse();
}