import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";
import { POST, PUT, DELETE } from "@/route-handlers/api/branches/route";

const CURRENT_USER_ID = "user-1";

function makeRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>
) {
  return new Request(`http://localhost${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    affiliateClient: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    capsuleOption: {
      findUnique: vi.fn(),
    },
    capsuleBranch: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

const mockGetUserId = vi.mocked(auth.getUserId);
const mockCapsuleOption = vi.mocked(prisma.capsuleOption);
const mockBranch = vi.mocked(prisma.capsuleBranch);

const OTHER_USER_ID = "user-2";

const fakeBranch = {
  id: "branch-1",
  optionId: "option-1",
  headline: "Titre accrocheur",
  description: "Description initiale",
  cta: "Contacter",
  proof: "Preuve",
  option: {
    capsule: {
      identity: {
        userId: CURRENT_USER_ID,
      },
    },
  },
};

describe("POST /api/branches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crÃ©e une branch et retourne 201", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockCapsuleOption.findUnique.mockResolvedValue({
      id: "option-1",
      capsule: {
        id: "capsule-1",
        identity: { id: "identity-1", userId: CURRENT_USER_ID },
      },
    } as never);
    mockBranch.create.mockResolvedValue(fakeBranch as never);

    const res = await POST(makeRequest("POST", "/api/branches", {
      optionId: "option-1",
      headline: "Titre accrocheur",
      description: "Description dÃ©taillÃ©e",
      cta: "Contactez-nous",
    }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.headline).toBe("Titre accrocheur");
  });

  it("retourne 400 si champs requis manquants", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await POST(makeRequest("POST", "/api/branches", {
      optionId: "option-1",
      headline: "Titre",
      // description et cta manquants
    }));
    expect(res.status).toBe(400);
  });

  it("retourne 401 si non authentifiÃ©", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await POST(makeRequest("POST", "/api/branches", {
      optionId: "option-1",
      headline: "Titre",
      description: "Desc",
      cta: "CTA",
    }));
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/branches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("met Ã  jour la branch et retourne 200", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockBranch.findUnique.mockResolvedValue(fakeBranch as never);
    mockBranch.update.mockResolvedValue({ ...fakeBranch, headline: "Nouveau titre" } as never);

    const res = await PUT(makeRequest("PUT", "/api/branches", {
      id: "branch-1",
      headline: "Nouveau titre",
      description: "Description",
      cta: "CTA",
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.headline).toBe("Nouveau titre");
  });

  it("retourne 400 si id manquant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await PUT(makeRequest("PUT", "/api/branches", { headline: "Titre" }));
    expect(res.status).toBe(400);
  });

  it("retourne 403 si la branch appartient Ã  un autre utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockBranch.findUnique.mockResolvedValue({
      ...fakeBranch,
      option: {
        capsule: { identity: { userId: OTHER_USER_ID } },
      },
    } as never);

    const res = await PUT(makeRequest("PUT", "/api/branches", {
      id: "branch-1",
      headline: "Titre",
      description: "Desc",
      cta: "CTA",
    }));
    expect(res.status).toBe(403);
  });

  it("retourne 401 si non authentifiÃ©", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await PUT(makeRequest("PUT", "/api/branches", {
      id: "branch-1",
      headline: "Titre",
      description: "Desc",
      cta: "CTA",
    }));
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/branches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supprime la branch et retourne 200", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockBranch.findUnique.mockResolvedValue(fakeBranch as never);
    mockBranch.delete.mockResolvedValue(fakeBranch as never);

    const res = await DELETE(makeRequest("DELETE", "/api/branches?id=branch-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("retourne 400 si id manquant", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);

    const res = await DELETE(makeRequest("DELETE", "/api/branches"));
    expect(res.status).toBe(400);
  });

  it("retourne 403 si la branch appartient Ã  un autre utilisateur", async () => {
    mockGetUserId.mockResolvedValue(CURRENT_USER_ID);
    mockBranch.findUnique.mockResolvedValue({
      ...fakeBranch,
      option: {
        capsule: { identity: { userId: OTHER_USER_ID } },
      },
    } as never);

    const res = await DELETE(makeRequest("DELETE", "/api/branches?id=branch-1"));
    expect(res.status).toBe(403);
  });

  it("retourne 401 si non authentifiÃ©", async () => {
    mockGetUserId.mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE", "/api/branches?id=branch-1"));
    expect(res.status).toBe(401);
  });
});











