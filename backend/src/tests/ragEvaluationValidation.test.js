import { describe, expect, it } from "vitest";
import {
  evaluateSnapshotsBatchSchema,
  evaluationSnapshotsQuerySchema,
  ragEvaluationsQuerySchema,
  reviewEvaluationSchema
} from "../validations/ragEvaluation.validation.js";

describe("ragEvaluation.validation", () => {
  describe("evaluateSnapshotsBatchSchema", () => {
    it("accepts a valid batch limit", () => {
      const result = evaluateSnapshotsBatchSchema.safeParse({
        limit: 5
      });

      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(5);
    });

    it("defaults batch limit to 3", () => {
      const result = evaluateSnapshotsBatchSchema.safeParse({});

      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(3);
    });

    it("rejects a batch limit greater than 10", () => {
      const result = evaluateSnapshotsBatchSchema.safeParse({
        limit: 20
      });

      expect(result.success).toBe(false);
    });
  });

  describe("reviewEvaluationSchema", () => {
    it("accepts a valid review decision and note", () => {
      const result = reviewEvaluationSchema.safeParse({
        reviewDecision: "retrieval_needs_fix",
        reviewNote: "Improve retrieval for this question."
      });

      expect(result.success).toBe(true);
      expect(result.data.reviewDecision).toBe("retrieval_needs_fix");
      expect(result.data.reviewNote).toBe("Improve retrieval for this question.");
    });

    it("defaults review decision to accepted", () => {
      const result = reviewEvaluationSchema.safeParse({
        reviewNote: "Looks good."
      });

      expect(result.success).toBe(true);
      expect(result.data.reviewDecision).toBe("accepted");
    });

    it("rejects an invalid review decision", () => {
      const result = reviewEvaluationSchema.safeParse({
        reviewDecision: "wrong_decision"
      });

      expect(result.success).toBe(false);
    });
  });

  describe("evaluationSnapshotsQuerySchema", () => {
    it("converts page and limit query strings into numbers", () => {
      const result = evaluationSnapshotsQuerySchema.safeParse({
        page: "2",
        limit: "20",
        evaluationStatus: "not_evaluated"
      });

      expect(result.success).toBe(true);
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(20);
      expect(result.data.evaluationStatus).toBe("not_evaluated");
    });

    it("defaults page and limit when they are missing", () => {
      const result = evaluationSnapshotsQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    });

    it("treats empty evaluationStatus as undefined", () => {
      const result = evaluationSnapshotsQuerySchema.safeParse({
        evaluationStatus: ""
      });

      expect(result.success).toBe(true);
      expect(result.data.evaluationStatus).toBeUndefined();
    });

    it("rejects invalid evaluationStatus", () => {
      const result = evaluationSnapshotsQuerySchema.safeParse({
        evaluationStatus: "bad_status"
      });

      expect(result.success).toBe(false);
    });

    it("rejects non-numeric page", () => {
      const result = evaluationSnapshotsQuerySchema.safeParse({
        page: "abc"
      });

      expect(result.success).toBe(false);
    });
  });

  describe("ragEvaluationsQuerySchema", () => {
    it("accepts valid completed evaluation filters", () => {
      const result = ragEvaluationsQuerySchema.safeParse({
        page: "3",
        limit: "5",
        reviewStatus: "unreviewed",
        recommendedAction: "improve_retrieval",
        reviewDecision: "retrieval_needs_fix",
        minOverallScore: "2",
        maxOverallScore: "4"
      });

      expect(result.success).toBe(true);
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(5);
      expect(result.data.reviewStatus).toBe("unreviewed");
      expect(result.data.recommendedAction).toBe("improve_retrieval");
      expect(result.data.reviewDecision).toBe("retrieval_needs_fix");
      expect(result.data.minOverallScore).toBe(2);
      expect(result.data.maxOverallScore).toBe(4);
    });

    it("defaults page and limit when filters are empty", () => {
      const result = ragEvaluationsQuerySchema.safeParse({
        reviewStatus: "",
        recommendedAction: "",
        reviewDecision: "",
        minOverallScore: "",
        maxOverallScore: ""
      });

      expect(result.success).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
      expect(result.data.reviewStatus).toBeUndefined();
      expect(result.data.recommendedAction).toBeUndefined();
      expect(result.data.reviewDecision).toBeUndefined();
      expect(result.data.minOverallScore).toBeUndefined();
      expect(result.data.maxOverallScore).toBeUndefined();
    });

    it("rejects invalid maxOverallScore", () => {
      const result = ragEvaluationsQuerySchema.safeParse({
        maxOverallScore: "abc"
      });

      expect(result.success).toBe(false);
    });

    it("rejects score values above 5", () => {
      const result = ragEvaluationsQuerySchema.safeParse({
        maxOverallScore: "6"
      });

      expect(result.success).toBe(false);
    });

    it("rejects when minOverallScore is greater than maxOverallScore", () => {
      const result = ragEvaluationsQuerySchema.safeParse({
        minOverallScore: "4",
        maxOverallScore: "2"
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid reviewStatus", () => {
      const result = ragEvaluationsQuerySchema.safeParse({
        reviewStatus: "finished"
      });

      expect(result.success).toBe(false);
    });
  });
});