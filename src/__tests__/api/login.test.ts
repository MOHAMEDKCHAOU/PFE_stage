import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { POST } from "@/route-handlers/api/login/route";

const mockCreateAuthSession = vi.hoisted(() => vi.fn());
const mockSetAuthCookie = vi.hoisted(() => vi.fn());
const mockAudit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  createAuthSession: mockCreateAuthSession,
  setAuthCookie: mockSetAuthCookie,
}));

vi.mock("@/lib/audit", () => ({ writeAuditLog: mockAudit }));

vi.mock("bcrypt", () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

const mockUser = vi.mocked(prisma.user);
const mockBcryptCompare = vi.mocked(bcrypt.compare);

function makePost(body: object) {
  return new Request("http://localhost/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const fakeUser = {
  id: "user-1",
  email: "user@test.com",
  password: "hashed_password",
  role: "USER",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
  identityProfiles: [],
};

describe("POST /api/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAuthSession.mockResolvedValue({
      token: "opaque-token",
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });
    mockSetAuthCookie.mockResolvedValue(undefined);
    mockAudit.mockResolvedValue(undefined);
  });

  it("creates an opaque server-side session and returns no password", async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser as never);
    mockBcryptCompare.mockResolvedValue(true as never);

    const res = await POST(makePost({ email: "USER@test.com", password: "pass123" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.email).toBe("user@test.com");
    expect(json.user.password).toBeUndefined();
    expect(json.user.permissions).toContain("dashboard:view");
    expect(mockCreateAuthSession).toHaveBeenCalledWith("user-1");
    expect(mockSetAuthCookie).toHaveBeenCalledWith("opaque-token", expect.any(Date));
  });

  it("returns 400 if email or password is missing", async () => {
    const res = await POST(makePost({ email: "user@test.com" }));
    expect(res.status).toBe(400);
  });

  it("returns the same 401 for an unknown account", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const res = await POST(makePost({ email: "unknown@test.com", password: "pass123" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 for an incorrect password", async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser as never);
    mockBcryptCompare.mockResolvedValue(false as never);
    const res = await POST(makePost({ email: "user@test.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("rejects suspended accounts and does not create a session", async () => {
    mockUser.findUnique.mockResolvedValue({ ...fakeUser, status: "SUSPENDED" } as never);
    mockBcryptCompare.mockResolvedValue(true as never);
    const res = await POST(makePost({ email: "user@test.com", password: "pass123" }));
    expect(res.status).toBe(403);
    expect(mockCreateAuthSession).not.toHaveBeenCalled();
  });

  it("returns 500 on a server error", async () => {
    mockUser.findUnique.mockRejectedValue(new Error("DB error"));
    const res = await POST(makePost({ email: "user@test.com", password: "pass123" }));
    expect(res.status).toBe(500);
  });
});
