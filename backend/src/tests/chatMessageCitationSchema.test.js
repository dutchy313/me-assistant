import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import ChatMessage from "../models/ChatMessage.js";

function createObjectId() {
  return new mongoose.Types.ObjectId();
}

describe("ChatMessage citation schema", () => {
  it("accepts assistant citations when sourceNumber is present", async () => {
    const message = new ChatMessage({
      sessionId: createObjectId(),
      userId: createObjectId(),
      role: "assistant",
      content: "A theory of change explains how activities are expected to lead to outcomes.",
      citations: [
        {
          sourceNumber: 1,
          documentId: createObjectId(),
          chunkId: createObjectId(),
          documentTitle: "Example Document",
          canonicalTitle: "Example Canonical Title",
          citationLabel: "Example Citation",
          authors: ["Example Author"],
          publicationYear: 2020,
          publisher: "Example Publisher",
          chunkIndex: 4,
          score: 0.82,
          excerpt: "Example source excerpt."
        }
      ]
    });

    await expect(message.validate()).resolves.toBeUndefined();
  });

  it("rejects assistant citations when sourceNumber is missing", async () => {
    const message = new ChatMessage({
      sessionId: createObjectId(),
      userId: createObjectId(),
      role: "assistant",
      content: "A theory of change explains how activities are expected to lead to outcomes.",
      citations: [
        {
          documentId: createObjectId(),
          chunkId: createObjectId(),
          documentTitle: "Example Document",
          chunkIndex: 4,
          score: 0.82,
          excerpt: "Example source excerpt."
        }
      ]
    });

    await expect(message.validate()).rejects.toThrow(/sourceNumber/);
  });

  it("accepts user messages without citations", async () => {
    const message = new ChatMessage({
      sessionId: createObjectId(),
      userId: createObjectId(),
      role: "user",
      content: "What is a theory of change?",
      citations: []
    });

    await expect(message.validate()).resolves.toBeUndefined();
  });
});