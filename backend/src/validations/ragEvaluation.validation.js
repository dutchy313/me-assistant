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