import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";
import { GET, POST, PUT, DELETE } from "@/route-handlers/api/identity/route";

vi.mock("@/lib/faymoos-badges", () => ({
  syncAutoBadgesForUser: vi.fn().mockResolvedValue(undefined),
}));

const mockLoadBillingUser = vi.fn();

vi.mock("@/lib/subscription-guards", () => ({
  assertCanCreateIdentity: vi.fn().mockResolvedValue(null),
  loadBillingUser: (...args: unknown[]) => mockLoadBillingUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    affiliateClient: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    user: {
      findMany: vi.fn(),
    },
    identityProfile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

const mockIdentity = vi.mocked(prisma.identityProfile);
const mockUserFindMany = vi.mocked(prisma.user.findMany);
const mockGetUserId = vi.mocked(auth.getUserId);

const CURRENT_USER_ID = "user-1";
const OTHER_USER_ID = "user-99";

const fakeIdentity = {
  id: "id-1",
  userId: CURRENT_USER_ID,
  name: "Alice",
  slug: "alice-123",
  type: "PERSONAL",
  bio: null,
  headline: null,
  avatar: null,
  cover: null,
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

describe("GET /api/identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindMany.mockResolvedValue([
      {
        id: CURRENT_USER_ID,
        role: "USER",
        stripeCustomerId: null,
        stripeSubscriptionId: "sub_x",
        subscriptionStatus: "active",
        subscriptionPlan: "PRO",
        currentPeriodEnd: new Date(),
      },
    ] as never);
  });

  it("retourne 200 avec les identités de l'utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockIdentity.findMany.mockResolvedValue([fakeIdentity] as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("id-1");
    expect(json[0].ownerCanHideBranding).toBe(true);
    expect(mockUserFindMany).toHaveBeenCalled();
  });

  it("retourne 401 si non authentifié", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe("POST /api/identity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée une identité et retourne 201", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockIdentity.create.mockResolvedValue(fakeIdentity as never);

    const res = await POST(makeRequest("POST", "/api/identity", { name: "Alice", type: "PERSONAL" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.name).toBe("Alice");
  });

  it("retourne 400 si name ou type manquant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await POST(makeRequest("POST", "/api/identity", { name: "Alice" }));
    expect(res.status).toBe(400);
  });

  it("retourne 401 si non authentifié", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await POST(makeRequest("POST", "/api/identity", { name: "Alice", type: "PERSONAL" }));
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadBillingUser.mockResolvedValue({
      id: CURRENT_USER_ID,
      role: "USER",
      stripeCustomerId: null,
      stripeSubscriptionId: "sub_x",
      subscriptionStatus: "active",
      subscriptionPlan: "PRO",
      currentPeriodEnd: new Date(),
    });
  });

  it("met à jour l'identité et retourne 200", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockIdentity.findUnique.mockResolvedValue(fakeIdentity as never);
    mockIdentity.update.mockResolvedValue({ ...fakeIdentity, name: "Alice Updated" } as never);

    const res = await PUT(makeRequest("PUT", "/api/identity", { id: "id-1", name: "Alice Updated", type: "PERSONAL" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.name).toBe("Alice Updated");
  });

  it("retourne 400 si id manquant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await PUT(makeRequest("PUT", "/api/identity", { name: "Alice" }));
    expect(res.status).toBe(400);
  });

  it("retourne 403 si l'identité appartient à un autre utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockIdentity.findUnique.mockResolvedValue({ ...fakeIdentity, userId: OTHER_USER_ID } as never);

    const res = await PUT(makeRequest("PUT", "/api/identity", { id: "id-1", name: "Alice", type: "PERSONAL" }));
    expect(res.status).toBe(403);
  });

  it("retourne 403 si hideBranding sans plan payant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockIdentity.findUnique.mockResolvedValue(fakeIdentity as never);
    mockLoadBillingUser.mockResolvedValueOnce({
      id: CURRENT_USER_ID,
      role: "USER",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPlan: "FREE",
      currentPeriodEnd: null,
    });

    const res = await PUT(
      makeRequest("PUT", "/api/identity", {
        id: "id-1",
        name: "Alice",
        type: "PERSONAL",
        hideBranding: true,
      }),
    );

    expect(res.status).toBe(403);
    expect(mockIdentity.update).not.toHaveBeenCalled();
  });

  it("retourne 401 si non authentifié", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await PUT(makeRequest("PUT", "/api/identity", { id: "id-1", name: "Alice", type: "PERSONAL" }));
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/identity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supprime l'identité et retourne 200", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockIdentity.findUnique.mockResolvedValue(fakeIdentity as never);
    mockIdentity.delete.mockResolvedValue(fakeIdentity as never);

    const res = await DELETE(makeRequest("DELETE", "/api/identity?id=id-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("retourne 400 si id manquant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await DELETE(makeRequest("DELETE", "/api/identity"));
    expect(res.status).toBe(400);
  });

  it("retourne 403 si l'identité appartient à un autre utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockIdentity.findUnique.mockResolvedValue({ ...fakeIdentity, userId: OTHER_USER_ID } as never);

    const res = await DELETE(makeRequest("DELETE", "/api/identity?id=id-1"));
    expect(res.status).toBe(403);
  });

  it("retourne 401 si non authentifié", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE", "/api/identity?id=id-1"));
    expect(res.status).toBe(401);
  });
});


