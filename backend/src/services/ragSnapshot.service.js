import RagEvaluationSnapshot from "../models/RagEvaluationSnapshot.js";

export async function createRagEvaluationSnapshot({
  sessionId,
  userMessageId,
  assistantMessageId,
  userId,
  originalQuestion,
  rewrittenQuestion,
  answer,
  answerModel,
  rewriteModel,
  embeddingModel,
  retrievalConfig,
  retrievedChunks,
  selectedChunks,
  citations
}) {
  const safeRetrievedChunks = normalizeRetrievedChunks({
    retrievedChunks,
    selectedChunks
  });

  const selectedContextText = buildSelectedContextText(selectedChunks);

  const snapshot = await RagEvaluationSnapshot.create({
    sessionId,
    userMessageId,
    assistantMessageId,
    userId,
    originalQuestion,
    rewrittenQuestion: rewrittenQuestion || "",
    answer,
    answerModel: answerModel || "",
    rewriteModel: rewriteModel || "",
    embeddingModel: embeddingModel || "",
    retrievalConfig: {
      topK: retrievalConfig?.topK || 5,
      candidateK: retrievalConfig?.candidateK || 20,
      minScore: retrievalConfig?.minScore ?? 0.2,
      maxChunksPerDocument: retrievalConfig?.maxChunksPerDocument || 2
    },
    retrievedChunks: safeRetrievedChunks,
    selectedContextText,
    citations: normalizeCitations(citations),
    evaluationStatus: "not_evaluated"
  });

  return snapshot;
}

function normalizeRetrievedChunks({ retrievedChunks = [], selectedChunks = [] }) {
  const selectedIds = new Set(
    selectedChunks
      .map((chunk) => String(chunk.chunkId || chunk._id || ""))
      .filter(Boolean)
  );

  return retrievedChunks.map((chunk) => {
    const chunkId = chunk.chunkId || chunk._id || null;
    const document = chunk.document || {};

    return {
      chunkId,
      documentId: chunk.documentId || document._id || null,
      documentTitle: chunk.documentTitle || document.title || "",
      canonicalTitle: chunk.canonicalTitle || document.canonicalTitle || "",
      citationLabel: chunk.citationLabel || document.citationLabel || "",
      authors: Array.isArray(chunk.authors)
        ? chunk.authors
        : Array.isArray(document.authors)
          ? document.authors
          : [],
      publicationYear:
        chunk.publicationYear || document.publicationYear || null,
      publisher: chunk.publisher || document.publisher || "",
      chunkIndex: chunk.chunkIndex || 0,
      score: Number(chunk.score || 0),
      selected: selectedIds.has(String(chunkId)),
      text: chunk.text || "",
      excerpt: chunk.excerpt || createExcerpt(chunk.text || "")
    };
  });
}

function normalizeCitations(citations = []) {
  return citations.map((citation) => ({
    documentId: citation.documentId || null,
    chunkId: citation.chunkId || null,
    documentTitle: citation.documentTitle || "",
    canonicalTitle: citation.canonicalTitle || "",
    citationLabel: citation.citationLabel || "",
    authors: Array.isArray(citation.authors) ? citation.authors : [],
    publicationYear: citation.publicationYear || null,
    publisher: citation.publisher || "",
    chunkIndex: citation.chunkIndex || 0,
    score: Number(citation.score || 0),
    excerpt: citation.excerpt || ""
  }));
}

function buildSelectedContextText(selectedChunks = []) {
  return selectedChunks
    .map((chunk, index) => {
      const label =
        chunk.citationLabel ||
        chunk.canonicalTitle ||
        chunk.documentTitle ||
        `Source ${index + 1}`;

      return [
        `[Source ${index + 1}: ${label}]`,
        `Chunk index: ${chunk.chunkIndex || 0}`,
        `Score: ${Number(chunk.score || 0).toFixed(4)}`,
        "",
        chunk.text || ""
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function createExcerpt(text = "", maxLength = 500) {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength)}...`;
}