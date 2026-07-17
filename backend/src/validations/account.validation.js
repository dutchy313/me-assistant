import { z } from "zod";

const passwordSchema = z
  .string({
    required_error: "Password is required"
  })
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password cannot be more than 128 characters long")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[0-9]/, "Password must include at least one number");

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        required_error: "Current password is required"
      })
      .min(1, "Current password is required"),

    newPassword: passwordSchema,

    confirmNewPassword: z
      .string({
        required_error: "Please confirm your new password"
      })
      .min(1, "Please confirm your new password")
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation password do not match",
    path: ["confirmNewPassword"]
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"]
  });