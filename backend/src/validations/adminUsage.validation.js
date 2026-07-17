import { z } from "zod";

function emptyStringToUndefined(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime());
}

const optionalDateString = (fieldName) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        invalid_type_error: `${fieldName} must be a date`
      })
      .refine(isValidDateString, {
        message: `${fieldName} must use YYYY-MM-DD format`
      })
      .optional()
  );

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

export const adminUsageQuerySchema = z
  .object({
    startDate: optionalDateString("Start date"),
    endDate: optionalDateString("End date"),

    page: optionalPositiveInteger("Page", 1, 100000),
    limit: optionalPositiveInteger("Limit", 20, 100),

    search: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .max(120, "Search cannot be more than 120 characters")
        .optional()
    )
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      return data.startDate <= data.endDate;
    },
    {
      message: "Start date cannot be after end date",
      path: ["startDate"]
    }
  );