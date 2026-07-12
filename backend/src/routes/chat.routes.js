import express from "express";
import {
  askChatQuestion,
  getChatSession,
  getChatSessionMessages,
  listChatSessions,
  sendChatMessage,
  sendChatSessionMessage
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/sessions", listChatSessions);

/*
  Older frontend route for asking a question.
  Keep this because ChatWorkspace currently calls /chat/ask.
*/
router.post("/ask", askChatQuestion);

/*
  Current/simple route for asking a question.
*/
router.post("/message", sendChatMessage);

/*
  Older frontend routes for loading and sending messages in a session.
*/
router.get("/sessions/:sessionId/messages", getChatSessionMessages);
router.post("/sessions/:sessionId/messages", sendChatSessionMessage);

/*
  Current/simple route for loading one session with messages.
*/
router.get("/sessions/:sessionId", getChatSession);

export default router;