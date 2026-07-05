import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long"),

  email: z.string().trim().email("Please provide a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required")
});

export const verifyLoginOtpSchema = z.object({
  tempToken: z.string().min(1, "Temporary token is required"),

  otp: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "OTP must be a 6-digit code")
});