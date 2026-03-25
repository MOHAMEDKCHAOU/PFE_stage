import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/register/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const mockUser = vi.mocked(prisma.user);
const mockBcryptHash = vi.mocked(bcrypt.hash);

function makePost(body: object) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const fakeUser = {
  id: "user-1",
  email: "test@test.com",
  password: "hashed",
  createdAt: new Date(),
  updatedAt: new Date(),
  identityProfiles: [{ id: "identity-1", name: "test", slug: "test-123" }],
};

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBcryptHash.mockResolvedValue("hashed" as never);
  });

  it("crée un user et retourne 201 sans le mot de passe", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockUser.create.mockResolvedValue(fakeUser as never);

    const res = await POST(makePost({ email: "test@test.com", password: "pass123" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.email).toBe("test@test.com");
    expect(json.password).toBeUndefined();
    expect(json.identityProfiles).toBeDefined();
  });

  it("retourne 400 si email manquant", async () => {
    const res = await POST(makePost({ password: "pass123" }));
    expect(res.status).toBe(400);
  });

  it("retourne 400 si password manquant", async () => {
    const res = await POST(makePost({ email: "test@test.com" }));
    expect(res.status).toBe(400);
  });

  it("retourne 409 si l'email est déjà utilisé", async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser as never);

    const res = await POST(makePost({ email: "test@test.com", password: "pass123" }));
    expect(res.status).toBe(409);
  });

  it("retourne 500 en cas d'erreur serveur", async () => {
    mockUser.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await POST(makePost({ email: "test@test.com", password: "pass123" }));
    expect(res.status).toBe(500);
  });
});
