import { z } from "zod";

const objectIdString = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId")
  .optional()
  .nullable();

export const answerFeedbackSchema = z.object({
  sessionId: objectIdString,
  messageId: objectIdString,

  rating: z.enum(["helpful", "not_helpful"]),

  reasons: z
    .array(
      z.enum([
        "not_accurate",
        "sources_not_relevant",
        "too_shallow",
        "too_long",
        "needed_example",
        "did_not_answer_question",
        "unclear_citation",
        "other"
      ])
    )
    .optional()
    .default([]),

  comment: z.string().trim().max(2000).optional().default(""),

  questionText: z.string().trim().max(5000).optional().default(""),

  answerText: z.string().trim().max(10000).optional().default("")
});

export const sourceFeedbackSchema = z.object({
  sessionId: objectIdString,
  messageId: objectIdString,
  documentId: objectIdString,
  chunkId: objectIdString,

  rating: z.enum(["useful", "not_useful"]),

  comment: z.string().trim().max(2000).optional().default(""),

  sourceTitle: z.string().trim().max(500).optional().default(""),

  excerpt: z.string().trim().max(5000).optional().default(""),

  retrievalScore: z.number().optional().nullable()
});

export const sessionFeedbackSchema = z.object({
  sessionId: objectIdString,

  helpedProgress: z.enum(["yes", "partly", "no"]),

  userGoal: z.enum([
    "understand_concept",
    "design_indicators",
    "build_logframe",
    "prepare_report",
    "plan_evaluation",
    "develop_theory_of_change",
    "review_proposal",
    "learning_research",
    "other"
  ]),

  comment: z.string().trim().max(2000).optional().default("")
});

export const productFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),

  usagePurpose: z
    .array(
      z.enum([
        "indicator_design",
        "theory_of_change",
        "logframe",
        "evaluation_methods",
        "data_collection",
        "reporting",
        "learning_research",
        "other"
      ])
    )
    .optional()
    .default([]),

  comment: z.string().trim().max(2000).optional().default(""),

  requestedFeature: z.string().trim().max(1000).optional().default(""),

  allowContact: z.boolean().optional().default(false)
});