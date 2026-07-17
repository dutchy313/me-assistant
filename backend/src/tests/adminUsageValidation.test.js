import { describe, expect, it } from "vitest";
import { adminUsageQuerySchema } from "../validations/adminUsage.validation.js";

describe("admin usage validation", () => {
  it("defaults pagination values when query is empty", () => {
    const result = adminUsageQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(20);
  });

  it("accepts valid date range and pagination values", () => {
    const result = adminUsageQuerySchema.safeParse({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      page: "2",
      limit: "50",
      search: "folusho"
    });

    expect(result.success).toBe(true);
    expect(result.data.startDate).toBe("2026-01-01");
    expect(result.data.endDate).toBe("2026-01-31");
    expect(result.data.page).toBe(2);
    expect(result.data.limit).toBe(50);
    expect(result.data.search).toBe("folusho");
  });

  it("rejects invalid start date format", () => {
    const result = adminUsageQuerySchema.safeParse({
      startDate: "01-01-2026"
    });

    expect(result.success).toBe(false);
  });

  it("rejects when startDate is after endDate", () => {
    const result = adminUsageQuerySchema.safeParse({
      startDate: "2026-02-01",
      endDate: "2026-01-01"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid pagination values", () => {
    const result = adminUsageQuerySchema.safeParse({
      page: "abc"
    });

    expect(result.success).toBe(false);
  });
});