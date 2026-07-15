import mongoose from "mongoose";

const REQUIRED_ENV_NAMES = [
  "MONGODB_URI",
  "JWT_SECRET",
  "APP_BASE_URL_WEB",
  "OPENAI_API_KEY",
  "OPENAI_EMBEDDING_MODEL",
  "OPENAI_EMBEDDING_DIMENSIONS",
  "OPENAI_CHAT_MODEL",
  "QDRANT_URL",
  "QDRANT_API_KEY",
  "QDRANT_COLLECTION_NAME"
];

const RECOMMENDED_ENV_NAMES = [
  "OPENAI_EVALUATION_MODEL",
  "RAG_TOP_K",
  "RAG_MIN_SCORE",
  "RAG_CANDIDATE_K",
  "RAG_MAX_CHUNKS_PER_DOCUMENT",
  "CHAT_RATE_LIMIT_WINDOW_MINUTES",
  "CHAT_RATE_LIMIT_MAX_REQUESTS",
  "EVALUATION_RATE_LIMIT_WINDOW_MINUTES",
  "EVALUATION_RATE_LIMIT_MAX_REQUESTS",
  "DAILY_CHAT_LIMIT_PER_USER",
  "DAILY_EVALUATION_LIMIT_PER_ADMIN",
  "MAX_CHAT_MESSAGE_LENGTH",
  "GOOGLE_DRIVE_FOLDER_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_CLOUD_PROJECT_ID",
  "GOOGLE_CLOUD_LOCATION",
  "GOOGLE_DOCUMENT_AI_PROCESSOR_ID"
];

export function getHealth(req, res) {
  res.status(200).json({
    status: "ok",
    app: process.env.APP_NAME || "M&E Assistant API",
    message: "Backend is running",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
}

export function getReadiness(req, res) {
  const report = buildReadinessReport();

  res.status(report.ready ? 200 : 503).json({
    status: report.ready ? "ready" : "not_ready",
    data: report
  });
}

export function buildReadinessReport({
  env = process.env,
  mongoReadyState = mongoose.connection.readyState
} = {}) {
  const missingRequiredEnv = getMissingEnvNames(REQUIRED_ENV_NAMES, env);
  const missingRecommendedEnv = getMissingEnvNames(RECOMMENDED_ENV_NAMES, env);

  const mongoStatus = getMongoConnectionStatus(mongoReadyState);
  const mongoReady = mongoReadyState === 1;

  const envReady = missingRequiredEnv.length === 0;

  const ready = envReady && mongoReady;

  return {
    ready,
    app: env.APP_NAME || "M&E Assistant API",
    environment: env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    checks: {
      environmentVariables: {
        ready: envReady,
        missingRequired: missingRequiredEnv,
        missingRecommended: missingRecommendedEnv
      },
      mongodb: {
        ready: mongoReady,
        state: mongoReadyState,
        status: mongoStatus
      }
    }
  };
}

export function getMissingEnvNames(names, env = process.env) {
  return names.filter((name) => {
    const value = env[name];

    return value === undefined || value === null || String(value).trim() === "";
  });
}

export function getMongoConnectionStatus(readyState) {
  if (readyState === 0) return "disconnected";
  if (readyState === 1) return "connected";
  if (readyState === 2) return "connecting";
  if (readyState === 3) return "disconnecting";

  return "unknown";
}