import crypto from "crypto";
import AppError from "../utils/AppError.js";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled() {
  return process.env.TURNSTILE_ENABLED === "true";
}

export async function verifyTurnstileToken(token, remoteIp) {
  if (!isTurnstileEnabled()) {
    return {
      success: true,
      skipped: true
    };
  }

  if (!process.env.TURNSTILE_SECRET_KEY) {
    throw new Error("TURNSTILE_SECRET_KEY is missing in environment variables");
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    throw new AppError(
      "Please complete the anti-bot verification before creating an account",
      400
    );
  }

  const formData = new URLSearchParams();

  formData.append("secret", process.env.TURNSTILE_SECRET_KEY);
  formData.append("response", token);
  formData.append("idempotency_key", crypto.randomUUID());

  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  let response;

  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData
    });
  } catch (error) {
    throw new AppError(
      "Anti-bot verification is temporarily unavailable. Please try again.",
      503
    );
  }

  let result;

  try {
    result = await response.json();
  } catch (error) {
    throw new AppError(
      "Anti-bot verification returned an invalid response. Please try again.",
      503
    );
  }

  if (!result.success) {
    throw new AppError(
      "Anti-bot verification failed. Please refresh the page and try again.",
      400
    );
  }

  return result;
}