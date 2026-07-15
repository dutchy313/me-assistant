import { z } from "zod";

function optionalTrimmedString(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed;
}

const optionalPositiveInteger = (fieldName, fallback, maxValue) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      return Number(value);
    },
    z
      .number({
        invalid_type_error: `${fieldName} must be a number`
      })
      .int(`${fieldName} must be a whole number`)
      .min(1, `${fieldName} must be at least 1`)
      .max(maxValue, `${fieldName} cannot be more than ${maxValue}`)
  );

const optionalScore = (fieldName) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }

      return Number(value);
    },
    z
      .number({
        invalid_type_error: `${fieldName} must be a number`
      })
      .min(1, `${fieldName} must be at least 1`)
      .max(5, `${fieldName} cannot be more than 5`)
      .optional()
  );

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

export const evaluationSnapshotsQuerySchema = z.object({
  page: optionalPositiveInteger("Page", 1, 100000),
  limit: optionalPositiveInteger("Limit", 10, 100),

  evaluationStatus: z.preprocess(
    optionalTrimmedString,
    z
      .enum(["not_evaluated", "evaluating", "evaluated", "failed"], {
        invalid_type_error: "Evaluation status is invalid"
      })
      .optional()
  )
});

export const ragEvaluationsQuerySchema = z
  .object({
    page: optionalPositiveInteger("Page", 1, 100000),
    limit: optionalPositiveInteger("Limit", 10, 100),

    reviewStatus: z.preprocess(
      optionalTrimmedString,
      z
        .enum(["unreviewed", "reviewed"], {
          invalid_type_error: "Review status is invalid"
        })
        .optional()
    ),

    recommendedAction: z.preprocess(
      optionalTrimmedString,
      z
        .enum(
          [
            "accept",
            "review_answer",
            "improve_retrieval",
            "improve_sources",
            "needs_human_review"
          ],
          {
            invalid_type_error: "Recommended action is invalid"
          }
        )
        .optional()
    ),

    reviewDecision: z.preprocess(
      optionalTrimmedString,
      z
        .enum(
          [
            "not_decided",
            "accepted",
            "answer_needs_fix",
            "retrieval_needs_fix",
            "source_needs_fix",
            "exclude_from_release"
          ],
          {
            invalid_type_error: "Review decision is invalid"
          }
        )
        .optional()
    ),

    minOverallScore: optionalScore("Minimum overall score"),
    maxOverallScore: optionalScore("Maximum overall score")
  })
  .refine(
    (data) => {
      if (
        data.minOverallScore === undefined ||
        data.maxOverallScore === undefined
      ) {
        return true;
      }

      return data.minOverallScore <= data.maxOverallScore;
    },
    {
      message:
        "Minimum overall score cannot be greater than maximum overall score",
      path: ["minOverallScore"]
    }
  );