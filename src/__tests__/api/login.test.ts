import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/login/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const mockCookieSet = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ set: mockCookieSet }),
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
  createdAt: new Date(),
  updatedAt: new Date(),
  identityProfiles: [],
};

describe("POST /api/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connecte l'utilisateur, pose un cookie et retourne 200 sans password", async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser as never);
    mockBcryptCompare.mockResolvedValue(true as never);

    const res = await POST(makePost({ email: "user@test.com", password: "pass123" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.email).toBe("user@test.com");
    expect(json.user.password).toBeUndefined();
    expect(mockCookieSet).toHaveBeenCalledWith(
      "faymoos_session",
      "user-1",
      expect.objectContaining({ httpOnly: true })
    );
  });

  it("retourne 400 si email ou password manquant", async () => {
    const res = await POST(makePost({ email: "user@test.com" }));
    expect(res.status).toBe(400);
  });

  it("retourne 404 si l'utilisateur n'existe pas", async () => {
    mockUser.findUnique.mockResolvedValue(null);

    const res = await POST(makePost({ email: "unknown@test.com", password: "pass123" }));
    expect(res.status).toBe(404);
  });

  it("retourne 401 si le mot de passe est incorrect", async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser as never);
    mockBcryptCompare.mockResolvedValue(false as never);

    const res = await POST(makePost({ email: "user@test.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("retourne 500 en cas d'erreur serveur", async () => {
    mockUser.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await POST(makePost({ email: "user@test.com", password: "pass123" }));
    expect(res.status).toBe(500);
  });
});
