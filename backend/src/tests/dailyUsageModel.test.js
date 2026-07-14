import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import DailyUsage from "../models/DailyUsage.js";

describe("DailyUsage model", () => {
  it("validates a daily usage record", async () => {
    const usage = new DailyUsage({
      userId: new mongoose.Types.ObjectId(),
      usageDate: "2026-07-14",
      chatMessages: 3,
      evaluations: 2
    });

    await expect(usage.validate()).resolves.toBeUndefined();
  });

  it("defaults chatMessages and evaluations to zero", () => {
    const usage = new DailyUsage({
      userId: new mongoose.Types.ObjectId(),
      usageDate: "2026-07-14"
    });

    expect(usage.chatMessages).toBe(0);
    expect(usage.evaluations).toBe(0);
  });

  it("has a compound unique index for userId and usageDate", () => {
    const indexes = DailyUsage.schema.indexes();

    const hasExpectedIndex = indexes.some(([fields, options]) => {
      return (
        fields.userId === 1 &&
        fields.usageDate === 1 &&
        options.unique === true
      );
    });

    expect(hasExpectedIndex).toBe(true);
  });
});