import rateLimit from "express-rate-limit";

function getNumberEnv(name, fallback) {
  const value = Number(process.env[name]);

  if (Number.isNaN(value) || value <= 0) {
    return fallback;
  }

  return value;
}

export const chatRateLimiter = rateLimit({
  windowMs:
    getNumberEnv("CHAT_RATE_LIMIT_WINDOW_MINUTES", 10) * 60 * 1000,
  max: getNumberEnv("CHAT_RATE_LIMIT_MAX_REQUESTS", 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message:
      "You are sending messages too quickly. Please wait a few minutes and try again."
  }
});

export const evaluationRateLimiter = rateLimit({
  windowMs:
    getNumberEnv("EVALUATION_RATE_LIMIT_WINDOW_MINUTES", 10) * 60 * 1000,
  max: getNumberEnv("EVALUATION_RATE_LIMIT_MAX_REQUESTS", 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message:
      "Evaluation requests are being sent too quickly. Please wait a few minutes and try again."
  }
});