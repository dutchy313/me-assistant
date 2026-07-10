import SourceChunk from "../models/SourceChunk.js";
import Document from "../models/Document.js";
import IngestionLog from "../models/IngestionLog.js";
import { createEmbedding } from "./embedding.service.js";
import {
  createQdrantPointId,
  ensureQdrantCollection,
  searchChunkVectors,
  upsertChunkVector
} from "./qdrant.service.js";

export async function prepareVectorCollection({ userId }) {
  const result = await ensureQdrantCollection();

  await IngestionLog.create({
    action: "qdrant_collection_ready",
    status: "success",
    message: result.created
      ? `Created Qdrant collection ${result.collectionName}`
      : `Qdrant collection ${result.collectionName} is ready`,
    createdBy: userId,
    metadata: result
  });

  return result;
}

export async function embedPendingChunks({ userId, limit = 25 }) {
  const safeLimit = Math.min(Number(limit) || 25, 100);

  await ensureQdrantCollection();

  const chunks = await SourceChunk.find({
    isActive: true,
    embeddingStatus: { $ne: "embedded" }
  })
    .sort({ createdAt: 1 })
    .limit(safeLimit)
    .populate("documentId", "title fileName sourceType driveFileId");

  const results = {
    totalSelected: chunks.length,
    embedded: 0,
    failed: 0
  };

  await IngestionLog.create({
    action: "embed_chunks",
    status: "info",
    message: `Started embedding ${chunks.length} chunk(s).`,
    createdBy: userId,
    metadata: {
      limit: safeLimit
    }
  });

  for (const chunk of chunks) {
    try {
      const embeddingResult = await createEmbedding(chunk.text);
      const pointId = createQdrantPointId(chunk._id);

      await upsertChunkVector({
        pointId,
        vector: embeddingResult.embedding,
        payload: {
          chunkId: chunk._id.toString(),
          documentId: chunk.documentId?._id?.toString() || "",
          documentTitle: chunk.documentId?.title || "",
          fileName: chunk.documentId?.fileName || "",
          sourceType: chunk.documentId?.sourceType || "",
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          tokenCount: chunk.tokenCount
        }
      });

      chunk.vectorId = pointId;
      chunk.embeddingStatus = "embedded";
      chunk.embeddingModel = embeddingResult.model;
      chunk.embeddingDimensions = embeddingResult.dimensions;
      chunk.embeddingError = "";
      chunk.embeddedAt = new Date();

      await chunk.save();

      results.embedded += 1;

      await IngestionLog.create({
        action: "chunk_embedded",
        status: "success",
        message: `Embedded chunk ${chunk.chunkIndex} from ${
          chunk.documentId?.fileName || "document"
        }.`,
        documentId: chunk.documentId?._id || null,
        chunkId: chunk._id,
        createdBy: userId,
        metadata: {
          model: embeddingResult.model,
          dimensions: embeddingResult.dimensions,
          usage: embeddingResult.usage
        }
      });
    } catch (error) {
      chunk.embeddingStatus = "failed";
      chunk.embeddingError = error.message;
      await chunk.save();

      results.failed += 1;

      await IngestionLog.create({
        action: "chunk_embedding_failed",
        status: "failed",
        message: `Failed to embed chunk ${chunk.chunkIndex}: ${error.message}`,
        documentId: chunk.documentId?._id || null,
        chunkId: chunk._id,
        createdBy: userId,
        metadata: {
          error: error.message
        }
      });
    }
  }

  await IngestionLog.create({
    action: "embed_chunks",
    status: "success",
    message: `Completed embedding. Embedded ${results.embedded}, failed ${results.failed}.`,
    createdBy: userId,
    metadata: results
  });

  return results;
}

export async function getVectorStats() {
  const [
    totalChunks,
    pendingChunks,
    embeddedChunks,
    failedChunks,
    indexedDocuments,
    embeddedDocuments
  ] = await Promise.all([
    SourceChunk.countDocuments({ isActive: true }),
    SourceChunk.countDocuments({
      isActive: true,
      embeddingStatus: "pending"
    }),
    SourceChunk.countDocuments({
      isActive: true,
      embeddingStatus: "embedded"
    }),
    SourceChunk.countDocuments({
      isActive: true,
      embeddingStatus: "failed"
    }),
    Document.countDocuments({
      status: "indexed",
      isActive: true
    }),
    SourceChunk.distinct("documentId", {
      isActive: true,
      embeddingStatus: "embedded"
    })
  ]);

  return {
    totalChunks,
    pendingChunks,
    embeddedChunks,
    failedChunks,
    indexedDocuments,
    documentsWithEmbeddings: embeddedDocuments.length
  };
}

export async function semanticSearch({ userId, query, limit = 5 }) {
  const embeddingResult = await createEmbedding(query);

  const qdrantResult = await searchChunkVectors({
    vector: embeddingResult.embedding,
    limit
  });

  const rawResults = qdrantResult.result?.points || qdrantResult.result || [];

  const results = rawResults.map((point) => ({
    id: point.id,
    score: point.score,
    payload: point.payload
  }));

  await IngestionLog.create({
    action: "semantic_search",
    status: "success",
    message: `Semantic search completed for query: ${query}`,
    createdBy: userId,
    metadata: {
      limit,
      resultCount: results.length,
      model: embeddingResult.model
    }
  });

  return {
    query,
    results
  };
}

export async function resetFailedChunkEmbeddings({ userId }) {
  const result = await SourceChunk.updateMany(
    {
      isActive: true,
      embeddingStatus: "failed"
    },
    {
      $set: {
        embeddingStatus: "pending",
        embeddingError: "",
        vectorId: "",
        embeddingModel: "",
        embeddingDimensions: 0,
        embeddedAt: null
      }
    }
  );

  await IngestionLog.create({
    action: "embed_chunks",
    status: "info",
    message: `Reset ${result.modifiedCount} failed chunk embedding(s) back to pending.`,
    createdBy: userId,
    metadata: {
      resetCount: result.modifiedCount
    }
  });

  return {
    resetCount: result.modifiedCount
  };
}