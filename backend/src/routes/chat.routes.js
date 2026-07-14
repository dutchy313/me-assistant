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
import { chatRateLimiter } from "../middlewares/productionRateLimit.middleware.js";
import { validateBody } from "../middlewares/requestValidation.middleware.js";
import { enforceDailyChatLimit } from "../middlewares/dailyUsageLimit.middleware.js";
import {
  chatAskSchema,
  chatSessionMessageSchema
} from "../validations/chat.validation.js";

const router = express.Router();

router.use(requireAuth);

router.get("/sessions", listChatSessions);

router.post(
  "/ask",
  chatRateLimiter,
  enforceDailyChatLimit(),
  validateBody(chatAskSchema),
  askChatQuestion
);

router.post(
  "/message",
  chatRateLimiter,
  enforceDailyChatLimit(),
  validateBody(chatAskSchema),
  sendChatMessage
);

router.get("/sessions/:sessionId/messages", getChatSessionMessages);

router.post(
  "/sessions/:sessionId/messages",
  chatRateLimiter,
  enforceDailyChatLimit(),
  validateBody(chatSessionMessageSchema),
  sendChatSessionMessage
);

router.get("/sessions/:sessionId", getChatSession);

export default router;