import { z } from "zod";

const objectIdString = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId")
  .optional()
  .nullable();

export const askQuestionSchema = z.object({
  sessionId: objectIdString,

  question: z
    .string()
    .trim()
    .min(3, "Question must be at least 3 characters long")
    .max(3000, "Question is too long")
});