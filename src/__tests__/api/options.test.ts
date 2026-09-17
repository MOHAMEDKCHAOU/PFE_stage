import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";
import { POST, PUT, DELETE } from "@/route-handlers/api/options/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    affiliateClient: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    capsule: {
      findUnique: vi.fn(),
    },
    capsuleOption: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => {
  const getUserId = vi.fn();

  const requirePermission = vi.fn(async () => {
    const userId = await getUserId();

    if (!userId) {
      return null;
    }

    return {
      userId,
      role: "USER",
      status: "ACTIVE",
      permissions: [],
      sessionId: "test-session",
    };
  });

  return {
    getUserId,
    requirePermission,
  };
});

const mockCapsule = vi.mocked(prisma.capsule);
const mockOption = vi.mocked(prisma.capsuleOption);
const mockGetUserId = vi.mocked(auth.getUserId);

const CURRENT_USER_ID = "user-1";
const OTHER_USER_ID = "user-99";

const fakeOption = {
  id: "option-1",
  label: "Option A",
  capsuleId: "capsule-1",
  capsule: { id: "capsule-1", identity: { id: "identity-1", userId: CURRENT_USER_ID } },
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(method: string, url: string, body?: object) {
  return new Request(`http://localhost${url}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/options", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée une option et retourne 201", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockCapsule.findUnique.mockResolvedValue({
      id: "capsule-1",
      identity: { id: "identity-1", userId: CURRENT_USER_ID },
    } as never);
    mockOption.aggregate.mockResolvedValue({ _max: { sortOrder: null } } as never);
    mockOption.create.mockResolvedValue(fakeOption as never);

    const res = await POST(makeRequest("POST", "/api/options", { capsuleId: "capsule-1", label: "Option A" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.label).toBe("Option A");
  });

  it("retourne 400 si capsuleId ou label manquant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await POST(makeRequest("POST", "/api/options", { capsuleId: "capsule-1" }));
    expect(res.status).toBe(400);
  });

  it("retourne 403 si la capsule appartient à un autre utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockCapsule.findUnique.mockResolvedValue({
      id: "capsule-1",
      identity: { id: "identity-1", userId: OTHER_USER_ID },
    } as never);

    const res = await POST(makeRequest("POST", "/api/options", { capsuleId: "capsule-1", label: "Option A" }));
    expect(res.status).toBe(403);
  });

  it("retourne 401 si non authentifié", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await POST(makeRequest("POST", "/api/options", { capsuleId: "capsule-1", label: "Option A" }));
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/options", () => {
  beforeEach(() => vi.clearAllMocks());

  it("met à jour l'option et retourne 200", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockOption.findUnique.mockResolvedValue(fakeOption as never);
    mockOption.update.mockResolvedValue({ ...fakeOption, label: "Option B" } as never);

    const res = await PUT(makeRequest("PUT", "/api/options", { id: "option-1", label: "Option B" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.label).toBe("Option B");
  });

  it("retourne 400 si id manquant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await PUT(makeRequest("PUT", "/api/options", { label: "Option B" }));
    expect(res.status).toBe(400);
  });

  it("retourne 403 si l'option appartient à un autre utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockOption.findUnique.mockResolvedValue({
      ...fakeOption,
      capsule: { id: "capsule-1", identity: { id: "identity-1", userId: OTHER_USER_ID } },
    } as never);

    const res = await PUT(makeRequest("PUT", "/api/options", { id: "option-1", label: "Option B" }));
    expect(res.status).toBe(403);
  });

  it("retourne 401 si non authentifié", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await PUT(makeRequest("PUT", "/api/options", { id: "option-1", label: "Option B" }));
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/options", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supprime l'option et retourne 200", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockOption.findUnique.mockResolvedValue(fakeOption as never);
    mockOption.delete.mockResolvedValue(fakeOption as never);

    const res = await DELETE(makeRequest("DELETE", "/api/options?id=option-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("retourne 400 si id manquant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await DELETE(makeRequest("DELETE", "/api/options"));
    expect(res.status).toBe(400);
  });

  it("retourne 403 si l'option appartient à un autre utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockOption.findUnique.mockResolvedValue({
      ...fakeOption,
      capsule: { id: "capsule-1", identity: { id: "identity-1", userId: OTHER_USER_ID } },
    } as never);

    const res = await DELETE(makeRequest("DELETE", "/api/options?id=option-1"));
    expect(res.status).toBe(403);
  });

  it("retourne 401 si non authentifié", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE", "/api/options?id=option-1"));
    expect(res.status).toBe(401);
  });
});

