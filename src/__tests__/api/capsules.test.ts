import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";
import { GET, POST, DELETE } from "@/route-handlers/api/capsules/route";

vi.mock("@/lib/faymoos-badges", () => ({
  syncAutoBadgesForUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    affiliateClient: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    capsule: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    identityProfile: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => {
  const getUserId = vi.fn();

  const getAuthContext = vi.fn(async () => {
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
    getAuthContext,
    requirePermission,
  };
});

const mockCapsule = vi.mocked(prisma.capsule);
const mockIdentity = vi.mocked(prisma.identityProfile);
const mockUser = vi.mocked(prisma.user);
const mockGetUserId = vi.mocked(auth.getUserId);

const CURRENT_USER_ID = "user-1";
const OTHER_USER_ID = "user-99";

const fakeIdentity = { id: "identity-1", userId: CURRENT_USER_ID };
const fakeCapsule = {
  id: "capsule-1",
  title: "Ma capsule",
  objective: "Convertir",
  identityId: "identity-1",
  identity: fakeIdentity,
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

describe("GET /api/capsules", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne 200 avec les capsules de l.identité", async () => {
    mockIdentity.findUnique.mockResolvedValue(fakeIdentity as never);
    mockCapsule.findMany.mockResolvedValue([fakeCapsule] as never);

    const res = await GET(makeRequest("GET", "/api/capsules?identityId=identity-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].title).toBe("Ma capsule");
  });

  it("retourne 400 si identityId manquant", async () => {
    const res = await GET(makeRequest("GET", "/api/capsules"));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/capsules", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crÃ©e une capsule et retourne 201", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockIdentity.findUnique.mockResolvedValue(fakeIdentity as never);
    mockUser.findUnique.mockResolvedValue({
      id: CURRENT_USER_ID,
      role: "USER",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPlan: "FREE",
      currentPeriodEnd: null,
    } as never);
    mockCapsule.count.mockResolvedValue(0);
    mockCapsule.create.mockResolvedValue(fakeCapsule as never);

    const res = await POST(makeRequest("POST", "/api/capsules", {
      identityId: "identity-1",
      title: "Ma capsule",
      objective: "Convertir",
    }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.title).toBe("Ma capsule");
  });

  it("retourne 400 si champs requis manquants", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await POST(makeRequest("POST", "/api/capsules", { identityId: "identity-1" }));
    expect(res.status).toBe(400);
  });

  it("retourne 403 si l'identitÃ© appartient Ã  un autre utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockIdentity.findUnique.mockResolvedValue({ id: "identity-1", userId: OTHER_USER_ID } as never);

    const res = await POST(makeRequest("POST", "/api/capsules", {
      identityId: "identity-1",
      title: "Capsule",
      objective: "Obj",
    }));
    expect(res.status).toBe(403);
  });

  it("retourne 401 si non authentifiÃ©", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await POST(makeRequest("POST", "/api/capsules", {
      identityId: "identity-1",
      title: "Capsule",
      objective: "Obj",
    }));
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/capsules", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supprime la capsule et retourne 200", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockCapsule.findUnique.mockResolvedValue(fakeCapsule as never);
    mockCapsule.delete.mockResolvedValue(fakeCapsule as never);

    const res = await DELETE(makeRequest("DELETE", "/api/capsules?id=capsule-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("retourne 400 si id manquant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await DELETE(makeRequest("DELETE", "/api/capsules"));
    expect(res.status).toBe(400);
  });

  it("retourne 403 si la capsule appartient Ã  un autre utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockCapsule.findUnique.mockResolvedValue({
      ...fakeCapsule,
      identity: { id: "identity-1", userId: OTHER_USER_ID },
    } as never);

    const res = await DELETE(makeRequest("DELETE", "/api/capsules?id=capsule-1"));
    expect(res.status).toBe(403);
  });

  it("retourne 401 si non authentifiÃ©", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE", "/api/capsules?id=capsule-1"));
    expect(res.status).toBe(401);
  });
});




