import { describe, expect, it } from "vitest";
import {
  buildReadinessReport,
  getMissingEnvNames,
  getMongoConnectionStatus
} from "../controllers/health.controller.js";

describe("health readiness helpers", () => {
  it("detects missing environment variable names", () => {
    const result = getMissingEnvNames(["A", "B", "C"], {
      A: "value",
      B: "",
      C: "   "
    });

    expect(result).toEqual(["B", "C"]);
  });

  it("maps MongoDB readyState values to readable statuses", () => {
    expect(getMongoConnectionStatus(0)).toBe("disconnected");
    expect(getMongoConnectionStatus(1)).toBe("connected");
    expect(getMongoConnectionStatus(2)).toBe("connecting");
    expect(getMongoConnectionStatus(3)).toBe("disconnecting");
    expect(getMongoConnectionStatus(99)).toBe("unknown");
  });

  it("marks the app ready when required env vars exist and MongoDB is connected", () => {
    const report = buildReadinessReport({
      mongoReadyState: 1,
      env: {
        NODE_ENV: "test",
        APP_NAME: "M&E Assistant API",
        MONGODB_URI: "mongodb://example",
        JWT_SECRET: "test-secret",
        APP_BASE_URL_WEB: "http://localhost:5173",
        OPENAI_API_KEY: "test-openai-key",
        OPENAI_EMBEDDING_MODEL: "text-embedding-3-small",
        OPENAI_EMBEDDING_DIMENSIONS: "1536",
        OPENAI_CHAT_MODEL: "gpt-4.1-mini",
        QDRANT_URL: "https://example-qdrant",
        QDRANT_API_KEY: "test-qdrant-key",
        QDRANT_COLLECTION_NAME: "me_assistant_chunks"
      }
    });

    expect(report.ready).toBe(true);
    expect(report.checks.environmentVariables.ready).toBe(true);
    expect(report.checks.mongodb.ready).toBe(true);
  });

  it("marks the app not ready when required env vars are missing", () => {
    const report = buildReadinessReport({
      mongoReadyState: 1,
      env: {
        NODE_ENV: "test",
        APP_NAME: "M&E Assistant API"
      }
    });

    expect(report.ready).toBe(false);
    expect(report.checks.environmentVariables.ready).toBe(false);
    expect(report.checks.environmentVariables.missingRequired).toContain(
      "MONGODB_URI"
    );
    expect(report.checks.environmentVariables.missingRequired).toContain(
      "JWT_SECRET"
    );
  });

  it("marks the app not ready when MongoDB is disconnected", () => {
    const report = buildReadinessReport({
      mongoReadyState: 0,
      env: {
        NODE_ENV: "test",
        APP_NAME: "M&E Assistant API",
        MONGODB_URI: "mongodb://example",
        JWT_SECRET: "test-secret",
        APP_BASE_URL_WEB: "http://localhost:5173",
        OPENAI_API_KEY: "test-openai-key",
        OPENAI_EMBEDDING_MODEL: "text-embedding-3-small",
        OPENAI_EMBEDDING_DIMENSIONS: "1536",
        OPENAI_CHAT_MODEL: "gpt-4.1-mini",
        QDRANT_URL: "https://example-qdrant",
        QDRANT_API_KEY: "test-qdrant-key",
        QDRANT_COLLECTION_NAME: "me_assistant_chunks"
      }
    });

    expect(report.ready).toBe(false);
    expect(report.checks.mongodb.ready).toBe(false);
    expect(report.checks.mongodb.status).toBe("disconnected");
  });
});