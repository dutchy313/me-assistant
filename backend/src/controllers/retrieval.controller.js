import { asyncHandler } from "../utils/asyncHandler.js";
import SourceChunk from "../models/SourceChunk.js";
import SourceFeedback from "../models/SourceFeedback.js";
import { retrieveRelevantChunks } from "../services/rag.service.js";

export const testRetrieval = asyncHandler(async (req, res) => {
  const {
    query,
    topK,
    candidateK,
    minScore,
    maxChunksPerDocument
  } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({
      status: "fail",
      message: "Query is required"
    });
  }

  const result = await retrieveRelevantChunks({
    question: query,
    topK,
    candidateK,
    minScore,
    maxChunksPerDocument
  });

  res.status(200).json({
    status: "success",
    message: "Retrieval test completed",
    data: {
      result: {
        query,
        retrievalConfig: result.retrievalConfig,
        selected: result.citations,
        candidates: result.rawCandidates
      }
    }
  });
});

export const previewChunk = asyncHandler(async (req, res) => {
  const chunk = await SourceChunk.findById(req.params.chunkId).populate(
    "documentId",
    "title fileName sourceType status totalChunks totalTokens"
  );

  if (!chunk) {
    return res.status(404).json({
      status: "fail",
      message: "Chunk not found"
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      chunk
    }
  });
});

export const sourceQualitySummary = asyncHandler(async (req, res) => {
  const [
    totalSourceFeedback,
    usefulSources,
    notUsefulSources,
    topNotUsefulSources,
    topUsefulSources,
    notUsefulByDocument
  ] = await Promise.all([
    SourceFeedback.countDocuments(),
    SourceFeedback.countDocuments({ rating: "useful" }),
    SourceFeedback.countDocuments({ rating: "not_useful" }),

    SourceFeedback.aggregate([
      { $match: { rating: "not_useful" } },
      {
        $group: {
          _id: {
            chunkId: "$chunkId",
            sourceTitle: "$sourceTitle"
          },
          count: { $sum: 1 },
          latestComment: { $last: "$comment" },
          averageRetrievalScore: { $avg: "$retrievalScore" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),

    SourceFeedback.aggregate([
      { $match: { rating: "useful" } },
      {
        $group: {
          _id: {
            chunkId: "$chunkId",
            sourceTitle: "$sourceTitle"
          },
          count: { $sum: 1 },
          averageRetrievalScore: { $avg: "$retrievalScore" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),

    SourceFeedback.aggregate([
      { $match: { rating: "not_useful" } },
      {
        $group: {
          _id: "$sourceTitle",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  const usefulnessRate =
    totalSourceFeedback === 0
      ? 0
      : Math.round((usefulSources / totalSourceFeedback) * 100);

  res.status(200).json({
    status: "success",
    data: {
      summary: {
        totalSourceFeedback,
        usefulSources,
        notUsefulSources,
        usefulnessRate,
        topNotUsefulSources,
        topUsefulSources,
        notUsefulByDocument
      }
    }
  });
});