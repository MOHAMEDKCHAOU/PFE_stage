import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  formatPartnerCode,
  generatePartnerCode,
  isSafeLogoUrl,
  normalizePartnerCode,
} from "@/lib/studio-partner-code";
import { cancelJoinRequest, getJoinPreview, postJoinRequest } from "@/route-handlers/api/studio/join/handlers";
import { PATCH as decideRequest } from "@/route-handlers/api/studio/join-requests/route";
import { PATCH as patchPartnerCode } from "@/route-handlers/api/studio/partner-code/route";

const mockGetUserId = vi.hoisted(() => vi.fn());
const mockRequireAffiliate = vi.hoisted(() => vi.fn());
const mockStudioGuard = vi.hoisted(() => vi.fn());
const mockCanAddClient = vi.hoisted(() => vi.fn());
const mockAudit = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn());
const tx = vi.hoisted(() => ({
  studioJoinRequest: { updateMany: vi.fn() },
  affiliateClient: { create: vi.fn() },
  studioPartnerProfile: { updateMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    affiliateClient: { findUnique: vi.fn(), create: vi.fn() },
    studioPartnerProfile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    studioJoinRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    notification: { create: vi.fn() },
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  },
}));

vi.mock("@/lib/auth", () => ({ getUserId: mockGetUserId, requireAffiliate: mockRequireAffiliate }));
vi.mock("@/lib/studio-plan-guard", () => ({ requireStudioSubscriptionOrResponse: mockStudioGuard }));
vi.mock("@/lib/subscription-guards", () => ({ assertCanAddStudioClient: mockCanAddClient }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: mockAudit }));
vi.mock("@/lib/rate-limit-memory", () => ({ checkRateLimit: mockRateLimit }));

const mockUser = vi.mocked(prisma.user);
const mockLink = vi.mocked(prisma.affiliateClient);
const mockProfile = vi.mocked(prisma.studioPartnerProfile);
const mockRequest = vi.mocked(prisma.studioJoinRequest);
const mockNotification = vi.mocked(prisma.notification);

const CODE = "K7F9QX2M";
const partnerRow = {
  code: CODE,
  active: true,
  agencyName: "Atelier Nord",
  logoUrl: null,
  affiliateUserId: "affiliate-1",
  affiliate: { email: "agency@test.com", role: "AFFILIATE", status: "ACTIVE" },
};

type UserRow = { email: string; role: string; status: string };
const users: Record<string, UserRow> = {
  "affiliate-1": { email: "agency@test.com", role: "AFFILIATE", status: "ACTIVE" },
  "client-1": { email: "client@test.com", role: "USER", status: "ACTIVE" },
  "admin-1": { email: "admin@test.com", role: "ADMIN", status: "ACTIVE" },
};

function req(method = "GET", body?: object) {
  return new Request("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserId.mockResolvedValue(null);
  mockRequireAffiliate.mockResolvedValue("affiliate-1");
  mockStudioGuard.mockResolvedValue(null);
  mockCanAddClient.mockResolvedValue(null);
  mockAudit.mockResolvedValue(undefined);
  mockRateLimit.mockReturnValue({ ok: true });
  mockUser.findUnique.mockImplementation((async (args: { where: { id: string } }) => users[args.where.id] ?? null) as never);
  mockLink.findUnique.mockResolvedValue(null);
  mockProfile.findUnique.mockResolvedValue(partnerRow as never);
  mockRequest.findFirst.mockResolvedValue(null);
  mockRequest.create.mockResolvedValue({ id: "request-1" } as never);
  mockRequest.count.mockResolvedValue(0);
  mockNotification.create.mockResolvedValue({} as never);
  tx.studioJoinRequest.updateMany.mockResolvedValue({ count: 1 });
  tx.affiliateClient.create.mockResolvedValue({});
  tx.studioPartnerProfile.updateMany.mockResolvedValue({ count: 1 });
});

describe("partner code format", () => {
  it("generates 8 unambiguous characters", () => {
    for (let i = 0; i < 50; i++) {
      const code = generatePartnerCode();
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    }
  });

  it("normalizes user input and rejects invalid codes", () => {
    expect(normalizePartnerCode("k7f9-qx2m")).toBe(CODE);
    expect(normalizePartnerCode(" K7F9 QX2M ")).toBe(CODE);
    expect(normalizePartnerCode("K7F9QX2")).toBeNull();
    expect(normalizePartnerCode("K7F9QX2O")).toBeNull(); // O is ambiguous → never issued
    expect(normalizePartnerCode("../../etc")).toBeNull();
    expect(formatPartnerCode(CODE)).toBe("K7F9-QX2M");
  });

  it("only accepts logos already uploaded to the platform", () => {
    expect(isSafeLogoUrl("/uploads/avatars/a-1.png")).toBe(true);
    expect(isSafeLogoUrl("https://evil.example/logo.png")).toBe(false);
    expect(isSafeLogoUrl("/uploads/../.env")).toBe(false);
    expect(isSafeLogoUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("GET /api/studio/join/[code] — public preview", () => {
  it("rejects a malformed code without touching the database", async () => {
    const res = await getJoinPreview(req(), "not-a-code");
    expect(res.status).toBe(404);
    expect(mockProfile.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 for a disabled code", async () => {
    mockProfile.findUnique.mockResolvedValue({ ...partnerRow, active: false } as never);
    expect((await getJoinPreview(req(), CODE)).status).toBe(404);
  });

  it("returns 404 when the affiliate is suspended or lost Studio access", async () => {
    mockProfile.findUnique.mockResolvedValue({ ...partnerRow, affiliate: { ...partnerRow.affiliate, status: "SUSPENDED" } } as never);
    expect((await getJoinPreview(req(), CODE)).status).toBe(404);
    mockProfile.findUnique.mockResolvedValue({ ...partnerRow, affiliate: { ...partnerRow.affiliate, role: "USER" } } as never);
    expect((await getJoinPreview(req(), CODE)).status).toBe(404);
  });

  it("masks the partner email and exposes no internal ids to anonymous visitors", async () => {
    const res = await getJoinPreview(req(), CODE);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.partnerEmail).toBe("a***@test.com");
    expect(json.viewer).toBeNull();
    expect(JSON.stringify(json)).not.toContain("affiliate-1");
  });

  it("shows the full partner email and request state to a signed-in client", async () => {
    mockGetUserId.mockResolvedValue("client-1");
    mockRequest.findFirst.mockResolvedValue({ status: "PENDING" } as never);
    const json = await (await getJoinPreview(req(), CODE)).json();
    expect(json.partnerEmail).toBe("agency@test.com");
    expect(json.viewer).toEqual({ isSelf: false, alreadyLinked: false, requestStatus: "PENDING" });
  });

  it("is rate limited", async () => {
    mockRateLimit.mockReturnValue({ ok: false, retryAfterMs: 1000 });
    expect((await getJoinPreview(req(), CODE)).status).toBe(429);
  });
});

describe("POST /api/studio/join/[code] — client asks to join", () => {
  beforeEach(() => mockGetUserId.mockResolvedValue("client-1"));

  it("requires a session", async () => {
    mockGetUserId.mockResolvedValue(null);
    expect((await postJoinRequest(req("POST"), CODE)).status).toBe(401);
    expect(mockRequest.create).not.toHaveBeenCalled();
  });

  it("creates a PENDING request and never links the account directly", async () => {
    const res = await postJoinRequest(req("POST"), CODE);
    expect(res.status).toBe(201);
    expect(mockRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { affiliateUserId: "affiliate-1", clientUserId: "client-1", source: "QR" } }),
    );
    expect(mockLink.create).not.toHaveBeenCalled();
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
    expect(mockNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "affiliate-1", type: "STUDIO_JOIN_REQUEST" }) }),
    );
  });

  it("is idempotent while a request is already pending", async () => {
    mockRequest.findFirst.mockResolvedValue({ id: "request-0", status: "PENDING", decidedAt: null } as never);
    const res = await postJoinRequest(req("POST"), CODE);
    expect(res.status).toBe(200);
    expect(mockRequest.create).not.toHaveBeenCalled();
  });

  it("refuses the affiliate scanning their own code", async () => {
    mockGetUserId.mockResolvedValue("affiliate-1");
    expect((await postJoinRequest(req("POST"), CODE)).status).toBe(400);
  });

  it("refuses admin accounts", async () => {
    mockGetUserId.mockResolvedValue("admin-1");
    expect((await postJoinRequest(req("POST"), CODE)).status).toBe(403);
  });

  it("refuses when already linked", async () => {
    mockLink.findUnique.mockResolvedValue({ id: "link-1" } as never);
    expect((await postJoinRequest(req("POST"), CODE)).status).toBe(409);
    expect(mockRequest.create).not.toHaveBeenCalled();
  });

  it("refuses when the affiliate has no client quota left", async () => {
    mockCanAddClient.mockResolvedValue({ status: 403, error: "Limite" });
    expect((await postJoinRequest(req("POST"), CODE)).status).toBe(409);
    expect(mockRequest.create).not.toHaveBeenCalled();
  });

  it("enforces a 24h cooldown after the affiliate declined", async () => {
    mockRequest.findFirst.mockResolvedValue({ id: "r", status: "DECLINED", decidedAt: new Date() } as never);
    expect((await postJoinRequest(req("POST"), CODE)).status).toBe(429);
    expect(mockRequest.create).not.toHaveBeenCalled();
  });

  it("lets the client cancel only their own pending request", async () => {
    mockProfile.findUnique.mockResolvedValue({ affiliateUserId: "affiliate-1" } as never);
    mockRequest.updateMany.mockResolvedValue({ count: 1 });
    const res = await cancelJoinRequest(req("DELETE"), CODE);
    expect(res.status).toBe(200);
    expect(mockRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { affiliateUserId: "affiliate-1", clientUserId: "client-1", status: "PENDING" } }),
    );
  });
});

describe("PATCH /api/studio/join-requests — affiliate decision", () => {
  const pendingRow = { id: "request-1", status: "PENDING", clientUserId: "client-1", client: { email: "client@test.com" } };

  beforeEach(() => {
    mockRequest.findFirst.mockResolvedValue(pendingRow as never);
    mockProfile.findUnique.mockResolvedValue({ agencyName: "Atelier Nord", affiliate: { email: "agency@test.com" } } as never);
  });

  it("only looks up requests addressed to the signed-in affiliate", async () => {
    mockRequest.findFirst.mockResolvedValue(null);
    const res = await decideRequest(req("PATCH", { id: "someone-elses", decision: "approve" }));
    expect(res.status).toBe(404);
    expect(mockRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "someone-elses", affiliateUserId: "affiliate-1" } }),
    );
  });

  it("approve: claims the request and creates the link in one transaction", async () => {
    const res = await decideRequest(req("PATCH", { id: "request-1", decision: "approve" }));
    expect(res.status).toBe(200);
    expect(tx.studioJoinRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "request-1", status: "PENDING" } }),
    );
    expect(tx.affiliateClient.create).toHaveBeenCalledWith({
      data: { affiliateUserId: "affiliate-1", clientUserId: "client-1" },
    });
    expect(mockNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "client-1", type: "STUDIO_JOIN_APPROVED" }) }),
    );
  });

  it("approve: a concurrent approval cannot create a second link", async () => {
    tx.studioJoinRequest.updateMany.mockResolvedValue({ count: 0 });
    const res = await decideRequest(req("PATCH", { id: "request-1", decision: "approve" }));
    expect(res.status).toBe(409);
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
  });

  it("approve: re-checks the affiliate quota at decision time", async () => {
    mockCanAddClient.mockResolvedValue({ status: 403, error: "Limite" });
    const res = await decideRequest(req("PATCH", { id: "request-1", decision: "approve" }));
    expect(res.status).toBe(409);
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
  });

  it("decline: marks the request declined without linking", async () => {
    mockRequest.updateMany.mockResolvedValue({ count: 1 });
    const res = await decideRequest(req("PATCH", { id: "request-1", decision: "decline" }));
    expect(res.status).toBe(200);
    expect(mockRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "DECLINED" }) }),
    );
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
  });

  it("refuses a request that was already handled", async () => {
    mockRequest.findFirst.mockResolvedValue({ ...pendingRow, status: "CANCELLED" } as never);
    expect((await decideRequest(req("PATCH", { id: "request-1", decision: "approve" }))).status).toBe(409);
  });
});

describe("PATCH /api/studio/partner-code — affiliate settings", () => {
  const profile = {
    id: "profile-1",
    affiliateUserId: "affiliate-1",
    code: CODE,
    active: true,
    agencyName: null,
    logoUrl: null,
    joinsCount: 0,
    rotatedAt: null,
  };

  beforeEach(() => {
    mockProfile.findUnique.mockResolvedValue(profile as never);
    mockProfile.update.mockImplementation((async (args: { data: object }) => ({ ...profile, ...args.data })) as never);
  });

  it("rejects an external logo URL", async () => {
    const res = await patchPartnerCode(req("PATCH", { logoUrl: "https://evil.example/x.png" }));
    expect(res.status).toBe(400);
    expect(mockProfile.update).not.toHaveBeenCalled();
  });

  it("rejects an agency name over 80 characters", async () => {
    const res = await patchPartnerCode(req("PATCH", { agencyName: "x".repeat(81) }));
    expect(res.status).toBe(400);
  });

  it("rotate: issues a new code (old QR stops working) and audits it", async () => {
    const res = await patchPartnerCode(req("PATCH", { action: "rotate" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    const data = mockProfile.update.mock.calls.at(-1)?.[0] as { data: { code: string } };
    expect(data.data.code).not.toBe(CODE);
    expect(json.code).toBe(formatPartnerCode(data.data.code));
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "STUDIO_PARTNER_CODE_ROTATED" }));
  });

  it("is reserved to Studio affiliates", async () => {
    mockRequireAffiliate.mockResolvedValue(null);
    mockStudioGuard.mockResolvedValue(new Response(null, { status: 403 }));
    const res = await patchPartnerCode(req("PATCH", { action: "disable" }));
    expect(res.status).toBe(403);
    expect(mockProfile.update).not.toHaveBeenCalled();
  });
});
