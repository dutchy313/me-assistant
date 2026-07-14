import { describe, expect, it } from "vitest";
import { createQdrantPointId } from "../services/qdrant.service.js";

describe("Qdrant service helpers", () => {
  it("creates a UUID-like Qdrant point ID from a MongoDB ObjectId", () => {
    const pointId = createQdrantPointId("64b7c2e51a2f4c001234abcd");

    expect(pointId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("creates the same point ID for the same chunk ID", () => {
    const first = createQdrantPointId("64b7c2e51a2f4c001234abcd");
    const second = createQdrantPointId("64b7c2e51a2f4c001234abcd");

    expect(first).toBe(second);
  });

  it("creates different point IDs for different chunk IDs", () => {
    const first = createQdrantPointId("64b7c2e51a2f4c001234abcd");
    const second = createQdrantPointId("64b7c2e51a2f4c001234abce");

    expect(first).not.toBe(second);
  });
});