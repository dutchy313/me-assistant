import OpenAI from "openai";
import ChatMessage from "../models/ChatMessage.js";
import ChatSession from "../models/ChatSession.js";
import Document from "../models/Document.js";
import SourceChunk from "../models/SourceChunk.js";
import { createEmbedding, getEmbeddingConfig } from "./embedding.service.js";
import { searchChunkVectors } from "./qdrant.service.js";
import { createRagEvaluationSnapshot } from "./ragSnapshot.service.js";

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

function getRagConfig() {
  return {
    topK: Number(process.env.RAG_TOP_K || 5),
    candidateK: Number(process.env.RAG_CANDIDATE_K || 20),
    minScore: Number(process.env.RAG_MIN_SCORE || 0.2),
    maxChunksPerDocument: Number(process.env.RAG_MAX_CHUNKS_PER_DOCUMENT || 2)
  };
}

export async function listUserChatSessions({ userId }) {
  return ChatSession.find({
    userId
  })
    .sort({ updatedAt: -1 })
    .limit(50);
}

export async function getChatSessionWithMessages({ sessionId, userId }) {
  const session = await ChatSession.findOne({
    _id: sessionId,
    userId
  });

  if (!session) {
    return null;
  }

  const messages = await ChatMessage.find({
    sessionId: session._id
  }).sort({ createdAt: 1 });

  return {
    session,
    messages
  };
}

export async function createChatAnswer({
  userId,
  sessionId,
  question
}) {
  if (!question || !question.trim()) {
    throw new Error("Question is required");
  }

  const session = await findOrCreateSession({
    userId,
    sessionId,
    question
  });

  const recentMessages = await ChatMessage.find({
    sessionId: session._id
  })
    .sort({ createdAt: -1 })
    .limit(8);

  const orderedRecentMessages = [...recentMessages].reverse();

  const userMessage = await ChatMessage.create({
    sessionId: session._id,
    userId,
    role: "user",
    content: question.trim(),
    citations: []
  });

  const rewriteResult = await rewriteQuestionForRetrieval({
    question: question.trim(),
    recentMessages: orderedRecentMessages
  });

  const retrievalQuestion = rewriteResult.rewrittenQuestion || question.trim();

  const embeddingResult = await createEmbedding(retrievalQuestion);

  const ragConfig = getRagConfig();

  const rawSearchResults = await searchChunkVectors({
    vector: embeddingResult.embedding,
    limit: ragConfig.candidateK
  });

  const retrievedChunks = await hydrateRetrievedChunks(rawSearchResults);
  const eligibleChunks = retrievedChunks.filter((chunk) => {
    return chunk.score >= ragConfig.minScore;
  });

  const selectedChunks = selectDiverseChunks({
    chunks: eligibleChunks,
    topK: ragConfig.topK,
    maxChunksPerDocument: ragConfig.maxChunksPerDocument
  });

  const contextText = buildContextText(selectedChunks);

  const answerResult = await generateAnswer({
    question: question.trim(),
    rewrittenQuestion: retrievalQuestion,
    contextText
  });

  const citations = buildCitations(selectedChunks);

  const assistantMessage = await ChatMessage.create({
    sessionId: session._id,
    userId,
    role: "assistant",
    content: answerResult.answer,
    citations
  });

  await createRagEvaluationSnapshot({
    sessionId: session._id,
    userMessageId: userMessage._id,
    assistantMessageId: assistantMessage._id,
    userId,
    originalQuestion: question.trim(),
    rewrittenQuestion: retrievalQuestion,
    answer: answerResult.answer,
    answerModel: answerResult.model,
    rewriteModel: rewriteResult.model,
    embeddingModel: embeddingResult.model || getEmbeddingConfig().model,
    retrievalConfig: ragConfig,
    retrievedChunks,
    selectedChunks,
    citations
  });

  session.title = session.title || createSessionTitle(question);
  session.lastMessageAt = new Date();
  await session.save();

  return {
    session,
    userMessage,
    assistantMessage,
    answer: answerResult.answer,
    citations,
    retrieval: {
      originalQuestion: question.trim(),
      rewrittenQuestion: retrievalQuestion,
      config: ragConfig,
      retrievedCount: retrievedChunks.length,
      selectedCount: selectedChunks.length
    }
  };
}

async function findOrCreateSession({ userId, sessionId, question }) {
  if (sessionId) {
    const existingSession = await ChatSession.findOne({
      _id: sessionId,
      userId
    });

    if (existingSession) {
      return existingSession;
    }
  }

  return ChatSession.create({
    userId,
    title: createSessionTitle(question),
    lastMessageAt: new Date()
  });
}

async function rewriteQuestionForRetrieval({ question, recentMessages }) {
  if (!recentMessages || recentMessages.length === 0) {
    return {
      rewrittenQuestion: question,
      model: ""
    };
  }

  const client = getOpenAIClient();
  const model = getChatModel();

  const conversationText = recentMessages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "Rewrite the user's latest question as a standalone retrieval query. Keep the meaning. Do not answer the question. Return only the rewritten query."
      },
      {
        role: "user",
        content: [
          "Conversation so far:",
          conversationText,
          "",
          "Latest question:",
          question,
          "",
          "Standalone retrieval query:"
        ].join("\n")
      }
    ],
    temperature: 0
  });

  const rewrittenQuestion = (response.output_text || "").trim();

  return {
    rewrittenQuestion: rewrittenQuestion || question,
    model
  };
}

async function hydrateRetrievedChunks(searchResponse) {
  const points = normalizeQdrantSearchResponse(searchResponse);

  const chunkIds = points
    .map((point) => point.payload?.chunkId)
    .filter(Boolean);

  const chunks = await SourceChunk.find({
    _id: {
      $in: chunkIds
    },
    isActive: true
  });

  const chunkMap = new Map(
    chunks.map((chunk) => [chunk._id.toString(), chunk])
  );

  const documentIds = [
    ...new Set(
      chunks.map((chunk) => chunk.documentId.toString()).filter(Boolean)
    )
  ];

  const documents = await Document.find({
    _id: {
      $in: documentIds
    }
  });

  const documentMap = new Map(
    documents.map((document) => [document._id.toString(), document])
  );

  return points
    .map((point) => {
      const chunkId = point.payload?.chunkId;
      const chunk = chunkMap.get(String(chunkId));

      if (!chunk) {
        return null;
      }

      const document = documentMap.get(chunk.documentId.toString());

      return {
        chunkId: chunk._id,
        documentId: chunk.documentId,
        documentTitle: document?.title || point.payload?.documentTitle || "",
        canonicalTitle: document?.canonicalTitle || "",
        citationLabel: document?.citationLabel || "",
        authors: document?.authors || [],
        publicationYear: document?.publicationYear || null,
        publisher: document?.publisher || "",
        sourceType: document?.sourceType || "",
        chunkIndex: chunk.chunkIndex,
        score: Number(point.score || 0),
        text: chunk.text,
        excerpt: createExcerpt(chunk.text),
        document
      };
    })
    .filter(Boolean);
}

function normalizeQdrantSearchResponse(searchResponse) {
  if (Array.isArray(searchResponse?.result)) {
    return searchResponse.result;
  }

  if (Array.isArray(searchResponse?.result?.points)) {
    return searchResponse.result.points;
  }

  if (Array.isArray(searchResponse?.points)) {
    return searchResponse.points;
  }

  return [];
}

function selectDiverseChunks({
  chunks,
  topK,
  maxChunksPerDocument
}) {
  const selected = [];
  const perDocumentCount = new Map();

  for (const chunk of chunks) {
    if (selected.length >= topK) {
      break;
    }

    const documentId = String(chunk.documentId);
    const currentCount = perDocumentCount.get(documentId) || 0;

    if (currentCount >= maxChunksPerDocument) {
      continue;
    }

    selected.push(chunk);
    perDocumentCount.set(documentId, currentCount + 1);
  }

  return selected;
}

function buildContextText(chunks) {
  if (!chunks || chunks.length === 0) {
    return "No relevant context was retrieved.";
  }

  return chunks
    .map((chunk, index) => {
      const sourceLabel =
        chunk.citationLabel ||
        chunk.canonicalTitle ||
        chunk.documentTitle ||
        `Source ${index + 1}`;

      return [
        `[Source ${index + 1}: ${sourceLabel}]`,
        `Document: ${chunk.canonicalTitle || chunk.documentTitle}`,
        `Authors: ${chunk.authors?.join(", ") || "Unknown"}`,
        `Year: ${chunk.publicationYear || "Unknown"}`,
        `Publisher: ${chunk.publisher || "Unknown"}`,
        `Chunk index: ${chunk.chunkIndex}`,
        `Retrieval score: ${chunk.score.toFixed(4)}`,
        "",
        chunk.text
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

async function generateAnswer({ question, rewrittenQuestion, contextText }) {
  const client = getOpenAIClient();
  const model = getChatModel();

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You are M&E Assistant, a source-grounded Monitoring and Evaluation assistant. Answer only from the provided context. If the context is insufficient, say what is missing. Do not invent sources. Keep the answer clear, practical, and evidence-based."
      },
      {
        role: "user",
        content: [
          "Original user question:",
          question,
          "",
          "Standalone retrieval question:",
          rewrittenQuestion,
          "",
          "Retrieved context:",
          contextText,
          "",
          "Answer the user using only the retrieved context."
        ].join("\n")
      }
    ],
    temperature: 0.2
  });

  return {
    answer: response.output_text || "",
    model
  };
}

function buildCitations(chunks) {
  return chunks.map((chunk) => ({
    documentId: chunk.documentId,
    chunkId: chunk.chunkId,
    documentTitle: chunk.documentTitle || "",
    canonicalTitle: chunk.canonicalTitle || "",
    citationLabel: chunk.citationLabel || "",
    authors: chunk.authors || [],
    publicationYear: chunk.publicationYear || null,
    publisher: chunk.publisher || "",
    chunkIndex: chunk.chunkIndex,
    score: chunk.score,
    excerpt: chunk.excerpt || createExcerpt(chunk.text)
  }));
}

function createSessionTitle(question = "") {
  const clean = question.replace(/\s+/g, " ").trim();

  if (!clean) {
    return "New chat";
  }

  if (clean.length <= 60) {
    return clean;
  }

  return `${clean.slice(0, 60)}...`;
}

function createExcerpt(text = "", maxLength = 500) {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength)}...`;
}