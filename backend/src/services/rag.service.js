import OpenAI from "openai";
import { createEmbedding } from "./embedding.service.js";
import { searchChunkVectors } from "./qdrant.service.js";

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

function getChatModel() {
  return process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";
}

function getRagConfig(overrides = {}) {
  return {
    topK: Number(overrides.topK || process.env.RAG_TOP_K || 5),
    candidateK: Number(
      overrides.candidateK || process.env.RAG_CANDIDATE_K || 20
    ),
    minScore: Number(overrides.minScore ?? process.env.RAG_MIN_SCORE ?? 0.2),
    maxChunksPerDocument: Number(
      overrides.maxChunksPerDocument ||
        process.env.RAG_MAX_CHUNKS_PER_DOCUMENT ||
        2
    )
  };
}

export async function answerQuestionWithRag({
  question,
  conversationMessages = []
}) {
  const standaloneQuestion = await rewriteQuestionWithConversation({
    question,
    conversationMessages
  });

  const retrievalResult = await retrieveRelevantChunks({
    question: standaloneQuestion
  });

  const {
    selectedPoints,
    citations,
    retrievalConfig: { topK, minScore }
  } = retrievalResult;

  if (citations.length === 0) {
    return {
      answer:
        "I could not find strong enough supporting sources in the indexed M&E library for this question. Try rephrasing the question, or index and embed more documents before asking again.",
      citations: [],
      model: getChatModel(),
      retrieval: {
        topK,
        minScore,
        resultCount: 0,
        originalQuestion: question,
        standaloneQuestion
      }
    };
  }

  const sourceBlock = buildSourceBlock(selectedPoints);
  const conversationBlock = buildConversationBlock(conversationMessages);

  const client = getOpenAIClient();
  const model = getChatModel();

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You are M&E Assistant, a careful Monitoring and Evaluation expert. Answer from the provided sources. Use recent conversation context only to understand follow-up references such as 'the second one', 'that method', or 'explain it more'. Do not invent facts. If sources are insufficient, say so. Use simple language. Include citation markers like [1], [2] where the answer uses a source. Do not invent book titles, page numbers, or citations."
      },
      {
        role: "user",
        content: [
          "Recent conversation context:",
          conversationBlock || "No previous conversation context.",
          "",
          "Original user question:",
          question,
          "",
          "Standalone search question used for retrieval:",
          standaloneQuestion,
          "",
          "Retrieved sources:",
          sourceBlock,
          "",
          "Write a helpful answer grounded in the sources. Use citation markers such as [1] and [2]. If the user asked a follow-up, answer it in the context of the recent conversation."
        ].join("\n")
      }
    ],
    temperature: 0.2
  });

  const answer =
    response.output_text ||
    "I could not generate an answer from the retrieved sources.";

  return {
    answer,
    citations,
    model,
    retrieval: {
      topK,
      minScore,
      resultCount: citations.length,
      originalQuestion: question,
      standaloneQuestion
    }
  };
}

export async function retrieveRelevantChunks({
  question,
  topK,
  candidateK,
  minScore,
  maxChunksPerDocument
}) {
  const retrievalConfig = getRagConfig({
    topK,
    candidateK,
    minScore,
    maxChunksPerDocument
  });

  const queryEmbedding = await createEmbedding(question);

  const qdrantResult = await searchChunkVectors({
    vector: queryEmbedding.embedding,
    limit: retrievalConfig.candidateK
  });

  const rawPoints = qdrantResult.result?.points || qdrantResult.result || [];

  const selectedPoints = selectDiverseRelevantPoints({
    points: rawPoints,
    minScore: retrievalConfig.minScore,
    topK: retrievalConfig.topK,
    maxChunksPerDocument: retrievalConfig.maxChunksPerDocument
  });

  const citations = selectedPoints.map((point, index) => {
    const payload = point.payload || {};

    return {
      sourceNumber: index + 1,
      chunkId: payload.chunkId || String(point.id),
      documentId: payload.documentId || "",
      documentTitle: payload.documentTitle || "Untitled source",
      fileName: payload.fileName || "",
      chunkIndex: Number(payload.chunkIndex || 0),
      score: Number(point.score || 0),
      excerpt: createExcerpt(payload.text || "")
    };
  });

  const rawCandidates = rawPoints.map((point, index) => {
    const payload = point.payload || {};

    return {
      rank: index + 1,
      id: point.id,
      score: Number(point.score || 0),
      chunkId: payload.chunkId || String(point.id),
      documentId: payload.documentId || "",
      documentTitle: payload.documentTitle || "Untitled source",
      fileName: payload.fileName || "",
      chunkIndex: Number(payload.chunkIndex || 0),
      excerpt: createExcerpt(payload.text || ""),
      selected: citations.some(
        (citation) => citation.chunkId === (payload.chunkId || String(point.id))
      )
    };
  });

  return {
    question,
    retrievalConfig,
    selectedPoints,
    citations,
    rawCandidates
  };
}

export async function rewriteQuestionWithConversation({
  question,
  conversationMessages = []
}) {
  if (!conversationMessages.length) {
    return question;
  }

  const conversationBlock = buildConversationBlock(conversationMessages);

  const client = getOpenAIClient();
  const model = getChatModel();

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "Rewrite the user's latest question into a standalone search query for a Monitoring and Evaluation knowledge base. Use the recent conversation only to resolve references like 'it', 'that', 'the second one', 'compare them', or 'give an example'. Keep the rewritten question concise. Do not answer the question. Return only the rewritten question."
      },
      {
        role: "user",
        content: [
          "Recent conversation:",
          conversationBlock,
          "",
          "Latest user question:",
          question,
          "",
          "Standalone search query:"
        ].join("\n")
      }
    ],
    temperature: 0
  });

  const rewritten = response.output_text?.trim();

  if (!rewritten) {
    return question;
  }

  return rewritten.slice(0, 1000);
}

function selectDiverseRelevantPoints({
  points,
  minScore,
  topK,
  maxChunksPerDocument
}) {
  const sortedPoints = [...points]
    .filter((point) => Number(point.score || 0) >= minScore)
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

  const selected = [];
  const documentCounts = new Map();

  for (const point of sortedPoints) {
    const payload = point.payload || {};
    const documentKey = payload.documentId || payload.fileName || "unknown";
    const currentCount = documentCounts.get(documentKey) || 0;

    if (currentCount >= maxChunksPerDocument) {
      continue;
    }

    selected.push(point);
    documentCounts.set(documentKey, currentCount + 1);

    if (selected.length >= topK) {
      break;
    }
  }

  return selected;
}

function buildSourceBlock(points) {
  return points
    .map((point, index) => {
      const payload = point.payload || {};

      return [
        `SOURCE ${index + 1}`,
        `Title: ${payload.documentTitle || "Untitled source"}`,
        `File: ${payload.fileName || "Unknown file"}`,
        `Chunk: ${payload.chunkIndex ?? "unknown"}`,
        `Score: ${Number(point.score || 0).toFixed(4)}`,
        "Text:",
        payload.text || ""
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function buildConversationBlock(messages = []) {
  return messages
    .map((message) => {
      const speaker = message.role === "assistant" ? "Assistant" : "User";
      return `${speaker}: ${truncateForPrompt(message.content, 1200)}`;
    })
    .join("\n\n");
}

function truncateForPrompt(text = "", maxLength = 1200) {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength)}...`;
}

function createExcerpt(text = "") {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= 500) {
    return clean;
  }

  return `${clean.slice(0, 500)}...`;
}