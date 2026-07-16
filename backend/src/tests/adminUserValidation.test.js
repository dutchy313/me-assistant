import { describe, expect, it } from "vitest";
import {
  adminUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema
} from "../validations/adminUser.validation.js";

describe("admin user validation", () => {
  it("defaults user list pagination values", () => {
    const result = adminUsersQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(20);
  });

  it("accepts valid user list filters", () => {
    const result = adminUsersQuerySchema.safeParse({
      page: "2",
      limit: "50",
      search: "folusho",
      role: "reviewer",
      status: "active"
    });

    expect(result.success).toBe(true);
    expect(result.data.page).toBe(2);
    expect(result.data.limit).toBe(50);
    expect(result.data.search).toBe("folusho");
    expect(result.data.role).toBe("reviewer");
    expect(result.data.status).toBe("active");
  });

  it("rejects invalid role filter", () => {
    const result = adminUsersQuerySchema.safeParse({
      role: "owner"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid status filter", () => {
    const result = adminUsersQuerySchema.safeParse({
      status: "archived"
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid role update", () => {
    const result = updateUserRoleSchema.safeParse({
      role: "admin"
    });

    expect(result.success).toBe(true);
    expect(result.data.role).toBe("admin");
  });

  it("rejects invalid role update", () => {
    const result = updateUserRoleSchema.safeParse({
      role: "super_admin"
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid status update", () => {
    const result = updateUserStatusSchema.safeParse({
      status: "disabled"
    });

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("disabled");
  });

  it("rejects invalid status update", () => {
    const result = updateUserStatusSchema.safeParse({
      status: "blocked"
    });

    expect(result.success).toBe(false);
  });
});