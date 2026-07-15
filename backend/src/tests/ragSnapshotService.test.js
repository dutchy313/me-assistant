import { describe, expect, it, vi } from "vitest";

vi.mock("../models/RagEvaluationSnapshot.js", () => {
  return {
    default: {
      create: vi.fn(async (payload) => payload)
    }
  };
});

const { createRagEvaluationSnapshot } = await import(
  "../services/ragSnapshot.service.js"
);

describe("ragSnapshot.service", () => {
  it("preserves citation sourceNumber when creating a RAG evaluation snapshot", async () => {
    const snapshot = await createRagEvaluationSnapshot({
      sessionId: "66f000000000000000000001",
      userMessageId: "66f000000000000000000002",
      assistantMessageId: "66f000000000000000000003",
      userId: "66f000000000000000000004",
      originalQuestion: "What is outcome harvesting?",
      rewrittenQuestion: "outcome harvesting evaluation method",
      answer: "Outcome harvesting is an evaluation approach.",
      answerModel: "gpt-4.1-mini",
      rewriteModel: "gpt-4.1-mini",
      embeddingModel: "text-embedding-3-small",
      retrievalConfig: {
        topK: 5,
        candidateK: 20,
        minScore: 0.2,
        maxChunksPerDocument: 2
      },
      retrievedChunks: [],
      selectedChunks: [],
      citations: [
        {
          sourceNumber: 3,
          documentTitle: "Outcome Harvesting",
          canonicalTitle: "Outcome Harvesting",
          citationLabel: "Outcome Harvesting Guide",
          authors: ["Ricardo Wilson-Grau"],
          publicationYear: 2018,
          publisher: "BetterEvaluation",
          chunkIndex: 12,
          score: 0.82,
          excerpt: "Outcome harvesting collects evidence of change."
        }
      ]
    });

    expect(snapshot.citations).toHaveLength(1);
    expect(snapshot.citations[0].sourceNumber).toBe(3);
  });

  it("adds fallback sourceNumber when older citation data does not include it", async () => {
    const snapshot = await createRagEvaluationSnapshot({
      sessionId: "66f000000000000000000001",
      userMessageId: "66f000000000000000000002",
      assistantMessageId: "66f000000000000000000003",
      userId: "66f000000000000000000004",
      originalQuestion: "What is a theory of change?",
      rewrittenQuestion: "theory of change evaluation",
      answer: "A theory of change explains how change is expected to happen.",
      answerModel: "gpt-4.1-mini",
      rewriteModel: "gpt-4.1-mini",
      embeddingModel: "text-embedding-3-small",
      retrievalConfig: {
        topK: 5,
        candidateK: 20,
        minScore: 0.2,
        maxChunksPerDocument: 2
      },
      retrievedChunks: [],
      selectedChunks: [],
      citations: [
        {
          documentTitle: "Theory of Change Guide",
          chunkIndex: 1,
          score: 0.75,
          excerpt: "A theory of change explains pathways of change."
        },
        {
          documentTitle: "Evaluation Planning Manual",
          chunkIndex: 8,
          score: 0.71,
          excerpt: "Evaluation questions can follow from the theory of change."
        }
      ]
    });

    expect(snapshot.citations).toHaveLength(2);
    expect(snapshot.citations[0].sourceNumber).toBe(1);
    expect(snapshot.citations[1].sourceNumber).toBe(2);
  });

  it("uses sourceNumber in selected context text when available", async () => {
    const snapshot = await createRagEvaluationSnapshot({
      sessionId: "66f000000000000000000001",
      userMessageId: "66f000000000000000000002",
      assistantMessageId: "66f000000000000000000003",
      userId: "66f000000000000000000004",
      originalQuestion: "What is impact evaluation?",
      rewrittenQuestion: "impact evaluation methods",
      answer: "Impact evaluation estimates the effects of an intervention.",
      answerModel: "gpt-4.1-mini",
      rewriteModel: "gpt-4.1-mini",
      embeddingModel: "text-embedding-3-small",
      retrievalConfig: {
        topK: 5,
        candidateK: 20,
        minScore: 0.2,
        maxChunksPerDocument: 2
      },
      retrievedChunks: [],
      selectedChunks: [
        {
          sourceNumber: 4,
          citationLabel: "Impact Evaluation Guide",
          chunkIndex: 2,
          score: 0.88,
          text: "Impact evaluation estimates causal effects."
        }
      ],
      citations: []
    });

    expect(snapshot.selectedContextText).toContain(
      "[Source 4: Impact Evaluation Guide]"
    );
  });
});