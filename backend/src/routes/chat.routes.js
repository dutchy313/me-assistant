import express from "express";
import {
  askQuestion,
  listMessages,
  listSessions
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { askQuestionSchema } from "../validations/chat.validation.js";

const router = express.Router();

router.use(requireAuth);

router.post("/ask", validate(askQuestionSchema), askQuestion);
router.get("/sessions", listSessions);
router.get("/sessions/:sessionId/messages", listMessages);

export default router;