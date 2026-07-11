import { z } from "zod";

function optionalYear() {
  return z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }

      return value;
    },
    z
      .number()
      .int()
      .min(1000)
      .max(new Date().getFullYear() + 1)
      .nullable()
      .optional()
  );
}

export const updateDocumentMetadataSchema = z
  .object({
    canonicalTitle: z.string().trim().max(1000).optional(),

    authors: z.array(z.string().trim().min(1).max(200)).optional(),

    publicationYear: optionalYear(),

    publisher: z.string().trim().max(300).optional(),

    citationLabel: z.string().trim().max(300).optional(),

    sourceType: z
      .enum(["book", "manual", "guide", "report", "web", "other"])
      .optional(),

    metadataStatus: z.enum(["auto", "needs_review", "reviewed"]).optional(),

    metadataNotes: z.string().trim().max(2000).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one metadata field is required"
  });