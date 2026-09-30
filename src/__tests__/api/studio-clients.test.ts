import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "@/route-handlers/api/studio/clients/route";
import { acceptStudioInviteForSessionUser } from "@/lib/studio-invite-accept-logic";

const mockRequireAffiliate = vi.hoisted(() => vi.fn());
const mockStudioGuard = vi.hoisted(() => vi.fn());
const mockCanAddClient = vi.hoisted(() => vi.fn());
const mockCanCreateInvite = vi.hoisted(() => vi.fn());
const mockAudit = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn());
const tx = vi.hoisted(() => ({
  studioClientInvite: { updateMany: vi.fn() },
  affiliateClient: { create: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    affiliateClient: { create: vi.fn() },
    studioClientInvite: { findFirst: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  },
}));

vi.mock("@/lib/auth", () => ({ requireAffiliate: mockRequireAffiliate }));
vi.mock("@/lib/studio-plan-guard", () => ({ requireStudioSubscriptionOrResponse: mockStudioGuard }));
vi.mock("@/lib/subscription-guards", () => ({
  assertCanAddStudioClient: mockCanAddClient,
  assertCanCreateStudioInvite: mockCanCreateInvite,
}));
vi.mock("@/lib/audit", () => ({ writeAuditLog: mockAudit }));
vi.mock("@/lib/rate-limit-memory", () => ({ checkRateLimit: mockRateLimit }));

const mockUser = vi.mocked(prisma.user);
const mockInvite = vi.mocked(prisma.studioClientInvite);
const mockLink = vi.mocked(prisma.affiliateClient);

function makePost(body: object) {
  return new Request("http://localhost/api/studio/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAffiliate.mockResolvedValue("affiliate-1");
  mockStudioGuard.mockResolvedValue(null);
  mockCanAddClient.mockResolvedValue(null);
  mockCanCreateInvite.mockResolvedValue(null);
  mockAudit.mockResolvedValue(undefined);
  mockRateLimit.mockReturnValue({ ok: true });
  mockUser.findUnique.mockResolvedValue({ email: "agency@test.com", role: "AFFILIATE", status: "ACTIVE" } as never);
  mockInvite.findFirst.mockResolvedValue(null);
  mockInvite.create.mockResolvedValue({ id: "invite-1" } as never);
});

describe("POST /api/studio/clients — access request, never a direct link", () => {
  it("creates a pending email-targeted invite instead of linking the account", async () => {
    const res = await POST(makePost({ email: "Victim@Test.com", confirmConsent: true }));
    const json = await res.json();

    expect(res.status).toBe(202);
    expect(json.status).toBe("PENDING_CLIENT_APPROVAL");
    expect(mockLink.create).not.toHaveBeenCalled();
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
    expect(mockInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ affiliateUserId: "affiliate-1", inviteeEmail: "victim@test.com" }),
      }),
    );
  });

  it("does not look up whether the email has an account (no enumeration)", async () => {
    const res = await POST(makePost({ email: "nobody@test.com", confirmConsent: true }));
    expect(res.status).toBe(202);
    expect(mockUser.findFirst).not.toHaveBeenCalled();
  });

  it("requires the affiliate consent attestation", async () => {
    const res = await POST(makePost({ email: "client@test.com" }));
    expect(res.status).toBe(400);
    expect(mockInvite.create).not.toHaveBeenCalled();
  });

  it("does not duplicate a request that is already pending", async () => {
    mockInvite.findFirst.mockResolvedValue({ id: "invite-0", expiresAt: new Date(Date.now() + 1000) } as never);
    const res = await POST(makePost({ email: "client@test.com", confirmConsent: true }));
    expect(res.status).toBe(202);
    expect(mockInvite.create).not.toHaveBeenCalled();
  });

  it("rejects the affiliate's own email", async () => {
    const res = await POST(makePost({ email: "agency@test.com", confirmConsent: true }));
    expect(res.status).toBe(400);
    expect(mockInvite.create).not.toHaveBeenCalled();
  });

  it("enforces the Studio client quota before sending a request", async () => {
    mockCanAddClient.mockResolvedValue({ status: 403, error: "Limite atteinte" });
    const res = await POST(makePost({ email: "client@test.com", confirmConsent: true }));
    expect(res.status).toBe(403);
    expect(mockInvite.create).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is not a Studio affiliate", async () => {
    mockRequireAffiliate.mockResolvedValue(null);
    mockStudioGuard.mockResolvedValue(new Response(null, { status: 403 }));
    const res = await POST(makePost({ email: "client@test.com", confirmConsent: true }));
    expect(res.status).toBe(403);
    expect(mockInvite.create).not.toHaveBeenCalled();
  });
});

describe("acceptStudioInviteForSessionUser — consent is the only way to link", () => {
  const now = new Date("2030-01-01T00:00:00.000Z");
  const invite = {
    id: "invite-1",
    affiliateUserId: "affiliate-1",
    inviteeEmail: "client@test.com",
    expiresAt: new Date("2030-01-08T00:00:00.000Z"),
    revokedAt: null,
    acceptedAt: null,
  };

  function mockUsers(affiliate: { role: string; status: string } | null) {
    mockUser.findUnique.mockImplementation((async (args: { where: { id: string } }) =>
      args.where.id === "client-1" ? { email: "client@test.com", role: "USER" } : affiliate) as never);
  }

  beforeEach(() => {
    mockUsers({ role: "AFFILIATE", status: "ACTIVE" });
    tx.studioClientInvite.updateMany.mockResolvedValue({ count: 1 });
    tx.affiliateClient.create.mockResolvedValue({});
  });

  it("links the account when the invited user accepts", async () => {
    const result = await acceptStudioInviteForSessionUser(invite, "client-1", now);
    expect(result.ok).toBe(true);
    expect(tx.affiliateClient.create).toHaveBeenCalledWith({
      data: { affiliateUserId: "affiliate-1", clientUserId: "client-1" },
    });
  });

  it("refuses an invite targeted at another email", async () => {
    mockUser.findUnique.mockImplementation((async (args: { where: { id: string } }) =>
      args.where.id === "client-1" ? { email: "other@test.com", role: "USER" } : { role: "AFFILIATE", status: "ACTIVE" }) as never);
    const result = await acceptStudioInviteForSessionUser(invite, "client-1", now);
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
  });

  it("refuses when the affiliate was suspended after sending the invite", async () => {
    mockUsers({ role: "AFFILIATE", status: "SUSPENDED" });
    const result = await acceptStudioInviteForSessionUser(invite, "client-1", now);
    expect(result).toMatchObject({ ok: false, status: 410 });
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
  });

  it("refuses when the affiliate lost Studio access", async () => {
    mockUsers({ role: "USER", status: "ACTIVE" });
    const result = await acceptStudioInviteForSessionUser(invite, "client-1", now);
    expect(result).toMatchObject({ ok: false, status: 410 });
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
  });

  it("refuses when the affiliate reached the client quota", async () => {
    mockCanAddClient.mockResolvedValue({ status: 403, error: "Limite atteinte" });
    const result = await acceptStudioInviteForSessionUser(invite, "client-1", now);
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
  });

  it("cannot accept the same invite twice (concurrent accept)", async () => {
    tx.studioClientInvite.updateMany.mockResolvedValue({ count: 0 });
    const result = await acceptStudioInviteForSessionUser(invite, "client-1", now);
    expect(result).toMatchObject({ ok: false, status: 410 });
    expect(tx.affiliateClient.create).not.toHaveBeenCalled();
  });
});
