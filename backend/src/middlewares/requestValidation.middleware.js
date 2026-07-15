import { badRequest } from "../utils/AppError.js";

function formatZodIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message
  }));
}

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});

    if (!result.success) {
      return next(
        badRequest(
          "Some information is missing or invalid. Please check your input and try again.",
          formatZodIssues(result.error)
        )
      );
    }

    req.body = result.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query || {});

    if (!result.success) {
      return next(
        badRequest(
          "Some filter or pagination values are invalid. Please check your filters and try again.",
          formatZodIssues(result.error)
        )
      );
    }

    req.validatedQuery = result.data;
    return next();
  };
}