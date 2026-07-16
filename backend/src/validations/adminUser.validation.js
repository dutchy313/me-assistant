import { z } from "zod";

function emptyStringToUndefined(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
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

export const adminUsersQuerySchema = z.object({
  page: optionalPositiveInteger("Page", 1, 100000),
  limit: optionalPositiveInteger("Limit", 20, 100),

  search: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(120, "Search cannot be more than 120 characters").optional()
  ),

  role: z.preprocess(
    emptyStringToUndefined,
    z.enum(["user", "reviewer", "admin"], {
      invalid_type_error: "Role filter is invalid"
    }).optional()
  ),

  status: z.preprocess(
    emptyStringToUndefined,
    z.enum(["active", "disabled"], {
      invalid_type_error: "Status filter is invalid"
    }).optional()
  )
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["user", "reviewer", "admin"], {
    required_error: "Role is required",
    invalid_type_error: "Role is invalid"
  })
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "disabled"], {
    required_error: "Status is required",
    invalid_type_error: "Status is invalid"
  })
});