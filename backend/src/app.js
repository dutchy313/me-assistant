import express from "express";
import cors from "cors";
import helmet from "helmet";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import accountRoutes from "./routes/account.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import documentRoutes from "./routes/document.routes.js";
import vectorRoutes from "./routes/vector.routes.js";
import retrievalRoutes from "./routes/retrieval.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import ragEvaluationRoutes from "./routes/ragEvaluation.routes.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

app.use(
  cors({
    origin: process.env.APP_BASE_URL_WEB || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/account", accountRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/admin/documents", documentRoutes);
app.use("/api/v1/admin/vectors", vectorRoutes);
app.use("/api/v1/admin/retrieval", retrievalRoutes);
app.use("/api/v1/admin/evaluations", ragEvaluationRoutes);
app.use("/api/v1/chat", chatRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Route not found: ${req.originalUrl}`
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  const safeMessage =
    error.isOperational && error.message
      ? error.message
      : getFriendlyUnexpectedErrorMessage(error);

  const responseBody = {
    status: error.status || "error",
    message: safeMessage
  };

  if (error.details) {
    responseBody.details = error.details;
  }

  if (!isProduction) {
    responseBody.debug = {
      message: error.message,
      stack: error.stack
    };
  }

  res.status(statusCode).json(responseBody);
});

function getFriendlyUnexpectedErrorMessage(error) {
  const message = String(error?.message || "").toLowerCase();

  if (
    message.includes("qdrant") ||
    message.includes("fetch failed") ||
    message.includes("connect timeout") ||
    message.includes("und_err_connect_timeout")
  ) {
    return "The knowledge search service is temporarily unavailable. Please try again shortly.";
  }

  if (
    message.includes("openai") ||
    message.includes("rate limit") ||
    message.includes("model") ||
    message.includes("api key")
  ) {
    return "The AI service is temporarily unavailable. Please try again shortly.";
  }

  if (
    message.includes("mongodb") ||
    message.includes("mongoose") ||
    message.includes("validation failed") ||
    message.includes("econnrefused")
  ) {
    return "The app could not save or load some data. Please try again.";
  }

  if (
    message.includes("google") ||
    message.includes("documentai") ||
    message.includes("drive")
  ) {
    return "The document processing service is temporarily unavailable. Please try again shortly.";
  }

  return "Something went wrong. Please try again.";
}

export default app;