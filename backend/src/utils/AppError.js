class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function badRequest(message, details = null) {
  return new AppError(message, 400, details);
}

export function unauthorized(message = "You must be logged in to continue") {
  return new AppError(message, 401);
}

export function forbidden(message = "You do not have permission to do this") {
  return new AppError(message, 403);
}

export function notFound(message = "Resource not found") {
  return new AppError(message, 404);
}

export function tooManyRequests(
  message = "Too many requests. Please try again later"
) {
  return new AppError(message, 429);
}

export function serviceUnavailable(
  message = "This service is temporarily unavailable. Please try again shortly"
) {
  return new AppError(message, 503);
}

export { AppError };

export default AppError;