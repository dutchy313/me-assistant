import OpenAI from "openai";
import RagEvaluation from "../models/RagEvaluation.js";
import RagEvaluationSnapshot from "../models/RagEvaluationSnapshot.js";

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

function getEvaluationModel() {
  return (
    process.env.OPENAI_EVALUATION_MODEL ||
    process.env.OPENAI_CHAT_MODEL ||
    "gpt-4.1-mini"
  );
}

export async function listEvaluationSnapshots({
  page = 1,
  limit = 20,
  evaluationStatus = ""
}) {
  const query = {};

  if (evaluationStatus) {
    query.evaluationStatus = evaluationStatus;
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const requestedPage = Math.max(Number(page) || 1, 1);

  const total = await RagEvaluationSnapshot.countDocuments(query);
  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
  const safePage = Math.min(requestedPage, totalPages);
  const skip = (safePage - 1) * safeLimit;

  const snapshots = await RagEvaluationSnapshot.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .populate("userId", "name email role");

  const counts = await RagEvaluationSnapshot.aggregate([
    {
      $group: {
        _id: "$evaluationStatus",
        count: { $sum: 1 }
      }
    }
  ]);

  const statusCounts = {
    total: 0,
    not_evaluated: 0,
    evaluating: 0,
    evaluated: 0,
    failed: 0
  };

  for (const item of counts) {
    statusCounts[item._id] = item.count;
    statusCounts.total += item.count;
  }

  return {
    snapshots,
    counts: statusCounts,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages
    }
  };
}

export async function listRagEvaluations({ page = 1, limit = 20 }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const requestedPage = Math.max(Number(page) || 1, 1);

  const total = await RagEvaluation.countDocuments();
  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
  const safePage = Math.min(requestedPage, totalPages);
  const skip = (safePage - 1) * safeLimit;

  const evaluations = await RagEvaluation.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .populate("userId", "name email role")
    .populate("snapshotId", "originalQuestion rewrittenQuestion answer createdAt");

  return {
    evaluations,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages
    }
  };
}

export async function getRagEvaluationSummary() {
  const [
    totalEvaluations,
    averageScores,
    labelCounts,
    actionCounts,
    recentLowScores
  ] = await Promise.all([
    RagEvaluation.countDocuments(),

    RagEvaluation.aggregate([
      {
        $group: {
          _id: null,
          overallScore: { $avg: "$overallScore" },
          contextRelevance: { $avg: "$contextRelevance.score" },
          contextSufficiency: { $avg: "$contextSufficiency.score" },
          answerRelevance: { $avg: "$answerRelevance.score" },
          answerCorrectness: { $avg: "$answerCorrectness.score" },
          answerGroundedness: { $avg: "$answerGroundedness.score" }
        }
      }
    ]),

    RagEvaluation.aggregate([
      {
        $group: {
          _id: "$overallLabel",
          count: { $sum: 1 }
        }
      }
    ]),

    RagEvaluation.aggregate([
      {
        $group: {
          _id: "$recommendedAction",
          count: { $sum: 1 }
        }
      }
    ]),

    RagEvaluation.find({
      overallScore: { $lte: 3 }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("snapshotId", "originalQuestion answer createdAt")
  ]);

  return {
    totalEvaluations,
    averages: normalizeAverageScores(averageScores[0]),
    labels: normalizeCounts(labelCounts),
    actions: normalizeCounts(actionCounts),
    recentLowScores
  };
}

export async function evaluateRagSnapshot({ snapshotId, userId }) {
  const snapshot = await RagEvaluationSnapshot.findById(snapshotId);

  if (!snapshot) {
    return null;
  }

  const existingEvaluation = await RagEvaluation.findOne({
    snapshotId: snapshot._id
  });

  if (existingEvaluation) {
    snapshot.evaluationStatus = "evaluated";
    snapshot.evaluationId = existingEvaluation._id;
    snapshot.errorMessage = "";
    await snapshot.save();

    return {
      snapshot,
      evaluation: existingEvaluation,
      alreadyEvaluated: true
    };
  }

  snapshot.evaluationStatus = "evaluating";
  snapshot.errorMessage = "";
  await snapshot.save();

  try {
    const evaluatorResult = await runOpenAiEvaluator(snapshot);
    const normalized = normalizeEvaluatorResult(evaluatorResult);

    const evaluation = await RagEvaluation.create({
      snapshotId: snapshot._id,
      sessionId: snapshot.sessionId,
      userMessageId: snapshot.userMessageId,
      assistantMessageId: snapshot.assistantMessageId,
      userId: snapshot.userId || userId,
      evaluatorModel: getEvaluationModel(),

      contextRelevance: normalized.contextRelevance,
      contextSufficiency: normalized.contextSufficiency,
      answerRelevance: normalized.answerRelevance,
      answerCorrectness: normalized.answerCorrectness,
      answerGroundedness: normalized.answerGroundedness,

      overallScore: normalized.overallScore,
      overallLabel: normalized.overallLabel,
      summary: normalized.summary,
      strengths: normalized.strengths,
      weaknesses: normalized.weaknesses,
      recommendedAction: normalized.recommendedAction,
      rawEvaluatorOutput: evaluatorResult
    });

    snapshot.evaluationStatus = "evaluated";
    snapshot.evaluationId = evaluation._id;
    snapshot.errorMessage = "";
    await snapshot.save();

    return {
      snapshot,
      evaluation,
      alreadyEvaluated: false
    };
  } catch (error) {
    snapshot.evaluationStatus = "failed";
    snapshot.errorMessage = error.message;
    await snapshot.save();

    throw error;
  }
}

async function runOpenAiEvaluator(snapshot) {
  const client = getOpenAIClient();
  const model = getEvaluationModel();

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You are a strict RAG evaluation judge for a Monitoring and Evaluation assistant. Evaluate only against the provided question, retrieved context, citations, and answer. Do not reward unsupported claims. Return only valid JSON. Do not use markdown."
      },
      {
        role: "user",
        content: buildEvaluationPrompt(snapshot)
      }
    ],
    temperature: 0
  });

  const rawText = response.output_text || "";
  return parseJsonObject(rawText);
}

function buildEvaluationPrompt(snapshot) {
  return [
    "Evaluate this RAG answer using the 1–5 rubric.",
    "",
    "Scoring scale:",
    "1 = The metric is not followed at all.",
    "2 = The metric is followed only to a limited extent.",
    "3 = The metric is followed to a good extent.",
    "4 = The metric is followed mostly.",
    "5 = The metric is followed completely.",
    "",
    "Metrics:",
    "",
    "1. contextRelevance:",
    "Do the retrieved/selected context chunks relate directly to the user's question?",
    "",
    "2. contextSufficiency:",
    "Is the selected context enough to answer the question properly, or is key evidence missing?",
    "",
    "3. answerRelevance:",
    "Does the assistant directly answer the user's question without drifting off-topic?",
    "",
    "4. answerCorrectness:",
    "Is the answer factually correct based on the selected context?",
    "",
    "5. answerGroundedness:",
    "Does the answer avoid hallucination? Score 5 when all important claims are supported by the selected context. Score lower when claims are unsupported, exaggerated, or invented.",
    "",
    "Return JSON with exactly this structure:",
    "{",
    '  "contextRelevance": { "score": 1, "reason": "string", "evidence": "string", "improvement": "string" },',
    '  "contextSufficiency": { "score": 1, "reason": "string", "evidence": "string", "improvement": "string" },',
    '  "answerRelevance": { "score": 1, "reason": "string", "evidence": "string", "improvement": "string" },',
    '  "answerCorrectness": { "score": 1, "reason": "string", "evidence": "string", "improvement": "string" },',
    '  "answerGroundedness": { "score": 1, "reason": "string", "evidence": "string", "improvement": "string" },',
    '  "summary": "string",',
    '  "strengths": ["string"],',
    '  "weaknesses": ["string"],',
    '  "recommendedAction": "accept|review_answer|improve_retrieval|improve_sources|needs_human_review"',
    "}",
    "",
    "Original user question:",
    snapshot.originalQuestion || "",
    "",
    "Rewritten retrieval question:",
    snapshot.rewrittenQuestion || "",
    "",
    "Selected context:",
    truncateText(snapshot.selectedContextText || "", 18000),
    "",
    "Assistant answer:",
    truncateText(snapshot.answer || "", 9000),
    "",
    "Citations:",
    JSON.stringify(
      (snapshot.citations || []).map((citation) => ({
        sourceNumber: citation.sourceNumber,
        citationLabel: citation.citationLabel,
        canonicalTitle: citation.canonicalTitle,
        documentTitle: citation.documentTitle,
        chunkIndex: citation.chunkIndex,
        score: citation.score,
        excerpt: citation.excerpt
      })),
      null,
      2
    )
  ].join("\n");
}

function normalizeEvaluatorResult(result = {}) {
  const contextRelevance = normalizeMetric(result.contextRelevance);
  const contextSufficiency = normalizeMetric(result.contextSufficiency);
  const answerRelevance = normalizeMetric(result.answerRelevance);
  const answerCorrectness = normalizeMetric(result.answerCorrectness);
  const answerGroundedness = normalizeMetric(result.answerGroundedness);

  const scores = [
    contextRelevance.score,
    contextSufficiency.score,
    answerRelevance.score,
    answerCorrectness.score,
    answerGroundedness.score
  ];

  const overallScore = roundToOneDecimal(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  );

  return {
    contextRelevance,
    contextSufficiency,
    answerRelevance,
    answerCorrectness,
    answerGroundedness,
    overallScore,
    overallLabel: getOverallLabel(overallScore),
    summary:
      typeof result.summary === "string" && result.summary.trim()
        ? result.summary.trim()
        : "Evaluation completed.",
    strengths: normalizeStringArray(result.strengths),
    weaknesses: normalizeStringArray(result.weaknesses),
    recommendedAction: normalizeRecommendedAction(result.recommendedAction)
  };
}

function normalizeMetric(metric = {}) {
  return {
    score: clampScore(metric.score),
    reason:
      typeof metric.reason === "string" && metric.reason.trim()
        ? metric.reason.trim()
        : "No reason provided.",
    evidence:
      typeof metric.evidence === "string" ? metric.evidence.trim() : "",
    improvement:
      typeof metric.improvement === "string" ? metric.improvement.trim() : ""
  };
}

function clampScore(value) {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return 1;
  }

  return Math.min(Math.max(Math.round(numeric), 1), 5);
}

function getOverallLabel(score) {
  if (score >= 4.7) return "excellent";
  if (score >= 4) return "very_good";
  if (score >= 3) return "good";
  if (score >= 2) return "limited";
  return "poor";
}

function normalizeRecommendedAction(value) {
  const allowed = new Set([
    "accept",
    "review_answer",
    "improve_retrieval",
    "improve_sources",
    "needs_human_review"
  ]);

  if (allowed.has(value)) {
    return value;
  }

  return "review_answer";
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function normalizeAverageScores(value = {}) {
  return {
    overallScore: roundToOneDecimal(value.overallScore || 0),
    contextRelevance: roundToOneDecimal(value.contextRelevance || 0),
    contextSufficiency: roundToOneDecimal(value.contextSufficiency || 0),
    answerRelevance: roundToOneDecimal(value.answerRelevance || 0),
    answerCorrectness: roundToOneDecimal(value.answerCorrectness || 0),
    answerGroundedness: roundToOneDecimal(value.answerGroundedness || 0)
  };
}

function normalizeCounts(items = []) {
  const result = {};

  for (const item of items) {
    result[item._id || "unknown"] = item.count;
  }

  return result;
}

function roundToOneDecimal(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function parseJsonObject(text = "") {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Evaluator did not return valid JSON");
    }

    return JSON.parse(match[0]);
  }
}

function truncateText(text = "", maxLength = 12000) {
  const clean = String(text).trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength)}...`;
}