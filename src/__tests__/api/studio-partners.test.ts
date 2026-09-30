import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET, DELETE } from "@/route-handlers/api/studio/partners/route";
import { canManageIdentityAsOwner } from "@/lib/studio-access";

const mockGetUserId = vi.hoisted(() => vi.fn());
const mockAudit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    affiliateClient: { findMany: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn() },
    notification: { create: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ getUserId: mockGetUserId }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: mockAudit }));

const mockLink = vi.mocked(prisma.affiliateClient);
const mockUser = vi.mocked(prisma.user);
const mockNotification = vi.mocked(prisma.notification);

function makeDelete(affiliateUserId?: string) {
  const qs = affiliateUserId ? `?affiliateUserId=${encodeURIComponent(affiliateUserId)}` : "";
  return new Request(`http://localhost/api/studio/partners${qs}`, { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUserId.mockResolvedValue("client-1");
  mockAudit.mockResolvedValue(undefined);
  mockUser.findUnique.mockResolvedValue({ email: "client@test.com", role: "USER", status: "ACTIVE" } as never);
  mockNotification.create.mockResolvedValue({} as never);
});

describe("GET /api/studio/partners", () => {
  it("requires a session", async () => {
    mockGetUserId.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockLink.findMany).not.toHaveBeenCalled();
  });

  it("lists only the partners linked to the signed-in client", async () => {
    mockLink.findMany.mockResolvedValue([
      { createdAt: new Date("2026-09-01T00:00:00.000Z"), affiliate: { id: "affiliate-1", email: "agency@test.com" } },
    ] as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockLink.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { clientUserId: "client-1" } }));
    expect(json).toEqual([
      { affiliateUserId: "affiliate-1", affiliateEmail: "agency@test.com", linkedAt: "2026-09-01T00:00:00.000Z" },
    ]);
  });
});

describe("DELETE /api/studio/partners", () => {
  it("requires a session", async () => {
    mockGetUserId.mockResolvedValue(null);
    const res = await DELETE(makeDelete("affiliate-1"));
    expect(res.status).toBe(401);
    expect(mockLink.deleteMany).not.toHaveBeenCalled();
  });

  it("requires affiliateUserId", async () => {
    const res = await DELETE(makeDelete());
    expect(res.status).toBe(400);
    expect(mockLink.deleteMany).not.toHaveBeenCalled();
  });

  it("only removes links where the signed-in user is the client", async () => {
    mockLink.deleteMany.mockResolvedValue({ count: 1 });
    await DELETE(makeDelete("affiliate-1"));
    expect(mockLink.deleteMany).toHaveBeenCalledWith({
      where: { clientUserId: "client-1", affiliateUserId: "affiliate-1" },
    });
  });

  it("returns 404 and has no side effects when no such link exists (e.g. someone else's link)", async () => {
    mockLink.deleteMany.mockResolvedValue({ count: 0 });
    const res = await DELETE(makeDelete("affiliate-of-someone-else"));
    expect(res.status).toBe(404);
    expect(mockAudit).not.toHaveBeenCalled();
    expect(mockNotification.create).not.toHaveBeenCalled();
  });

  it("revokes access, writes an audit entry and notifies the partner", async () => {
    mockLink.deleteMany.mockResolvedValue({ count: 1 });
    const res = await DELETE(makeDelete("affiliate-1"));

    expect(res.status).toBe(200);
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: "client-1", action: "STUDIO_CLIENT_UNLINKED_BY_CLIENT" }),
    );
    expect(mockNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "affiliate-1", type: "STUDIO_ACCESS_REVOKED" }) }),
    );
  });

  it("still succeeds if the partner notification fails", async () => {
    mockLink.deleteMany.mockResolvedValue({ count: 1 });
    mockNotification.create.mockRejectedValue(new Error("DB error"));
    const res = await DELETE(makeDelete("affiliate-1"));
    expect(res.status).toBe(200);
  });
});

describe("after revocation", () => {
  it("the former partner can no longer manage the client's data", async () => {
    mockLink.findUnique.mockResolvedValue(null);
    await expect(canManageIdentityAsOwner("affiliate-1", "client-1")).resolves.toBe(false);
  });
});
