import { describe, expect, it } from "vitest";
import { evaluateSnapshotsBatchSchema } from "../validations/ragEvaluation.validation.js";

describe("RAG evaluation validation", () => {
  it("accepts a valid batch evaluation limit", () => {
    const result = evaluateSnapshotsBatchSchema.safeParse({
      limit: 5
    });

    expect(result.success).toBe(true);
    expect(result.data.limit).toBe(5);
  });

  it("defaults batch evaluation limit to 3", () => {
    const result = evaluateSnapshotsBatchSchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data.limit).toBe(3);
  });

  it("rejects batch limits below 1", () => {
    const result = evaluateSnapshotsBatchSchema.safeParse({
      limit: 0
    });

    expect(result.success).toBe(false);
  });

  it("rejects batch limits above 10", () => {
    const result = evaluateSnapshotsBatchSchema.safeParse({
      limit: 11
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-number limits", () => {
    const result = evaluateSnapshotsBatchSchema.safeParse({
      limit: "5"
    });

    expect(result.success).toBe(false);
  });
});