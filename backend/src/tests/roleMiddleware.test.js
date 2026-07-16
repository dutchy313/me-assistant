import { describe, expect, it, vi } from "vitest";
import {
  requireAdmin,
  requireReviewerOrAdmin,
  requireRole
} from "../middlewares/auth.middleware.js";

function createMockResponse() {
  return {};
}

function createNextSpy() {
  return vi.fn();
}

describe("role-based authorization middleware", () => {
  it("allows a user with an allowed role", () => {
    const req = {
      user: {
        role: "reviewer"
      }
    };

    const res = createMockResponse();
    const next = createNextSpy();

    const middleware = requireRole("reviewer", "admin");
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("blocks a user without an allowed role", () => {
    const req = {
      user: {
        role: "user"
      }
    };

    const res = createMockResponse();
    const next = createNextSpy();

    const middleware = requireRole("reviewer", "admin");
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });

  it("blocks access when no logged-in user exists", () => {
    const req = {};
    const res = createMockResponse();
    const next = createNextSpy();

    const middleware = requireRole("admin");
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it("allows admins through requireAdmin", () => {
    const req = {
      user: {
        role: "admin"
      }
    };

    const res = createMockResponse();
    const next = createNextSpy();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("allows reviewers through requireReviewerOrAdmin", () => {
    const req = {
      user: {
        role: "reviewer"
      }
    };

    const res = createMockResponse();
    const next = createNextSpy();

    requireReviewerOrAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("allows admins through requireReviewerOrAdmin", () => {
    const req = {
      user: {
        role: "admin"
      }
    };

    const res = createMockResponse();
    const next = createNextSpy();

    requireReviewerOrAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});