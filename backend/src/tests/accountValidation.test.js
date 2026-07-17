import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "../validations/account.validation.js";

describe("account.validation", () => {
  it("accepts a valid change password payload", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123",
      newPassword: "NewPassword123",
      confirmNewPassword: "NewPassword123"
    });

    expect(result.success).toBe(true);
  });

  it("rejects when current password is missing", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "NewPassword123",
      confirmNewPassword: "NewPassword123"
    });

    expect(result.success).toBe(false);
  });

  it("rejects weak new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123",
      newPassword: "password",
      confirmNewPassword: "password"
    });

    expect(result.success).toBe(false);
  });

  it("rejects when new password and confirmation do not match", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123",
      newPassword: "NewPassword123",
      confirmNewPassword: "DifferentPassword123"
    });

    expect(result.success).toBe(false);
  });

  it("rejects when current password and new password are the same", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "SamePassword123",
      newPassword: "SamePassword123",
      confirmNewPassword: "SamePassword123"
    });

    expect(result.success).toBe(false);
  });
});