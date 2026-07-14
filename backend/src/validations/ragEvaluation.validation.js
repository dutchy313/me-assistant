import { z } from "zod";

export const evaluateSnapshotsBatchSchema = z.object({
  limit: z
    .number({
      invalid_type_error: "Limit must be a number"
    })
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1")
    .max(10, "Limit cannot be more than 10")
    .optional()
    .default(3)
});

export const reviewEvaluationSchema = z.object({
  reviewDecision: z
    .enum([
      "accepted",
      "answer_needs_fix",
      "retrieval_needs_fix",
      "source_needs_fix",
      "exclude_from_release"
    ])
    .default("accepted"),

  reviewNote: z
    .string()
    .trim()
    .max(2000, "Review note cannot be more than 2000 characters")
    .optional()
    .default("")
});