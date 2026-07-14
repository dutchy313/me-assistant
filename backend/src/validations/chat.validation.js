import { z } from "zod";

function getMaxChatMessageLength() {
  const value = Number(process.env.MAX_CHAT_MESSAGE_LENGTH);

  if (Number.isNaN(value) || value <= 0) {
    return 4000;
  }

  return value;
}

const objectIdString = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId")
  .optional()
  .nullable();

const messageSchema = z
  .string({
    required_error: "Message is required"
  })
  .trim()
  .min(3, "Message must be at least 3 characters long")
  .max(
    getMaxChatMessageLength(),
    `Message is too long. Please keep it under ${getMaxChatMessageLength()} characters.`
  );

export const chatAskSchema = z
  .object({
    sessionId: objectIdString,
    message: messageSchema.optional(),
    question: messageSchema.optional()
  })
  .refine((data) => data.message || data.question, {
    message: "Message or question is required",
    path: ["message"]
  });

export const chatSessionMessageSchema = z
  .object({
    message: messageSchema.optional(),
    question: messageSchema.optional()
  })
  .refine((data) => data.message || data.question, {
    message: "Message or question is required",
    path: ["message"]
  });

/*
  Backward-compatible export.

  Some older code may still import askQuestionSchema.
  Keeping this prevents route/import errors while we transition.
*/
export const askQuestionSchema = chatAskSchema;