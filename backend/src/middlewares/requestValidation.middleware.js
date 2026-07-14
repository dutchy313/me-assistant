import { badRequest } from "../utils/AppError.js";

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }));

      return next(
        badRequest(
          "Some information is missing or invalid. Please check your input and try again.",
          details
        )
      );
    }

    req.body = result.data;
    return next();
  };
}