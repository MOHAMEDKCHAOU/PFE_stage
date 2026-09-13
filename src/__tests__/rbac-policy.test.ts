import { describe, expect, it } from "vitest";
import {
  canManagePlatformRole,
  hasPermission,
  normalizeRole,
  permissionsForRole,
} from "@/lib/rbac-policy";

describe("RBAC policy", () => {
  it("normalizes unknown legacy roles to USER", () => {
    expect(normalizeRole("SOMETHING_OLD")).toBe("USER");
  });

  it("keeps normal creators away from administration", () => {
    expect(hasPermission("USER", "identity:create")).toBe(true);
    expect(hasPermission("USER", "admin:users:read")).toBe(false);
  });

  it("gives affiliates delegated Studio capabilities", () => {
    expect(hasPermission("AFFILIATE", "studio:access")).toBe(true);
    expect(hasPermission("AFFILIATE", "admin:users:write")).toBe(false);
  });

  it("keeps moderator permissions separate from user administration", () => {
    expect(hasPermission("MODERATOR", "admin:capsules:moderate")).toBe(true);
    expect(hasPermission("MODERATOR", "admin:users:read")).toBe(false);
  });

  it("allows admins to manage non-privileged roles only", () => {
    expect(canManagePlatformRole("ADMIN", "USER", "AFFILIATE")).toBe(true);
    expect(canManagePlatformRole("ADMIN", "ADMIN", "USER")).toBe(false);
    expect(canManagePlatformRole("ADMIN", "USER", "SUPER_ADMIN")).toBe(false);
  });

  it("reserves destructive user administration for SUPER_ADMIN", () => {
    expect(hasPermission("ADMIN", "admin:users:delete")).toBe(false);
    expect(hasPermission("SUPER_ADMIN", "admin:users:delete")).toBe(true);
    expect(permissionsForRole("SUPER_ADMIN").length).toBeGreaterThan(permissionsForRole("ADMIN").length);
  });
});
