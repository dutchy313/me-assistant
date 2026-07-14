import { describe, expect, it } from "vitest";
import AppError, {
  badRequest,
  forbidden,
  notFound,
  serviceUnavailable,
  tooManyRequests,
  unauthorized
} from "../utils/AppError.js";

describe("AppError utility", () => {
  it("supports default AppError import", () => {
    const error = new AppError("Something failed", 400);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Something failed");
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe("fail");
    expect(error.isOperational).toBe(true);
  });

  it("creates a bad request error", () => {
    const error = badRequest("Invalid input", [
      {
        field: "message",
        message: "Message is required"
      }
    ]);

    expect(error.statusCode).toBe(400);
    expect(error.status).toBe("fail");
    expect(error.details).toHaveLength(1);
  });

  it("creates auth and permission errors", () => {
    expect(unauthorized().statusCode).toBe(401);
    expect(forbidden().statusCode).toBe(403);
    expect(notFound().statusCode).toBe(404);
  });

  it("creates rate limit and service unavailable errors", () => {
    expect(tooManyRequests().statusCode).toBe(429);
    expect(serviceUnavailable().statusCode).toBe(503);
  });
});