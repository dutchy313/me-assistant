import { z } from "zod";

export const updateDocumentMetadataSchema = z.object({
  canonicalTitle: z.string().trim().max(1000).optional().default(""),

  authors: z
    .array(z.string().trim().min(1).max(200))
    .optional()
    .default([]),

  publicationYear: z
    .number()
    .int()
    .min(1000)
    .max(new Date().getFullYear() + 1)
    .optional()
    .nullable(),

  publisher: z.string().trim().max(300).optional().default(""),

  citationLabel: z.string().trim().max(300).optional().default(""),

  sourceType: z
    .enum(["book", "manual", "guide", "report", "web", "other"])
    .optional()
    .default("book"),

  metadataStatus: z
    .enum(["auto", "needs_review", "reviewed"])
    .optional()
    .default("reviewed"),

  metadataNotes: z.string().trim().max(2000).optional().default("")
});