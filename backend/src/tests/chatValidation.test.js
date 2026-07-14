import { describe, expect, it } from "vitest";
import {
  askQuestionSchema,
  chatAskSchema,
  chatSessionMessageSchema
} from "../validations/chat.validation.js";

describe("Chat validation schemas", () => {
  it("accepts a valid question payload", () => {
    const result = chatAskSchema.safeParse({
      question: "What is a theory of change?"
    });

    expect(result.success).toBe(true);
    expect(result.data.question).toBe("What is a theory of change?");
  });

  it("accepts a valid message payload", () => {
    const result = chatAskSchema.safeParse({
      message: "Explain experimental design in simple terms."
    });

    expect(result.success).toBe(true);
    expect(result.data.message).toBe(
      "Explain experimental design in simple terms."
    );
  });

  it("accepts a valid sessionId when continuing a chat", () => {
    const result = chatAskSchema.safeParse({
      sessionId: "64b7c2e51a2f4c001234abcd",
      question: "Can you explain that further?"
    });

    expect(result.success).toBe(true);
    expect(result.data.sessionId).toBe("64b7c2e51a2f4c001234abcd");
  });

  it("rejects invalid MongoDB sessionId values", () => {
    const result = chatAskSchema.safeParse({
      sessionId: "not-a-valid-object-id",
      question: "Can you explain that further?"
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty chat requests", () => {
    const result = chatAskSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects messages shorter than 3 characters", () => {
    const result = chatAskSchema.safeParse({
      message: "a"
    });

    expect(result.success).toBe(false);
  });

  it("accepts session message payloads without sessionId in body", () => {
    const result = chatSessionMessageSchema.safeParse({
      message: "Continue from the previous explanation."
    });

    expect(result.success).toBe(true);
  });

  it("keeps askQuestionSchema backward compatible", () => {
    const result = askQuestionSchema.safeParse({
      question: "What is process evaluation?"
    });

    expect(result.success).toBe(true);
  });
});