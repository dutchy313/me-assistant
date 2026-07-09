import { asyncHandler } from "../utils/asyncHandler.js";
import {
  embedPendingChunks,
  getVectorStats,
  prepareVectorCollection,
  semanticSearch
} from "../services/vector.service.js";

export const prepareCollection = asyncHandler(async (req, res) => {
  const result = await prepareVectorCollection({
    userId: req.user._id
  });

  res.status(200).json({
    status: "success",
    message: "Qdrant collection is ready",
    data: {
      result
    }
  });
});

export const embedChunks = asyncHandler(async (req, res) => {
  const limit = Number(req.body.limit || 25);

  const result = await embedPendingChunks({
    userId: req.user._id,
    limit
  });

  res.status(200).json({
    status: "success",
    message: "Chunk embedding completed",
    data: {
      result
    }
  });
});

export const vectorStats = asyncHandler(async (req, res) => {
  const stats = await getVectorStats();

  res.status(200).json({
    status: "success",
    data: {
      stats
    }
  });
});

export const searchVectors = asyncHandler(async (req, res) => {
  const { query, limit } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({
      status: "fail",
      message: "Search query is required"
    });
  }

  const result = await semanticSearch({
    userId: req.user._id,
    query,
    limit: Number(limit || 5)
  });

  res.status(200).json({
    status: "success",
    message: "Semantic search completed",
    data: {
      result
    }
  });
});