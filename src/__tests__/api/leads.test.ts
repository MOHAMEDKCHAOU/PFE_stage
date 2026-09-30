import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPublicLead } from "@/lib/leads";
import { GET, PATCH, POST } from "@/route-handlers/api/leads/route";
import { POST as postMessage } from "../../../app/api/messages/route";

const mockGetAuth = vi.hoisted(() => vi.fn());
const mockRequirePermission = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn());
const mockManaged = vi.hoisted(() => vi.fn());
const mockCanManage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    identityProfile: { findUnique: vi.fn() },
    capsule: { findFirst: vi.fn() },
    capsuleOption: { findFirst: vi.fn() },
    lead: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), groupBy: vi.fn() },
    message: { create: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({ getAuthContext: mockGetAuth, requirePermission: mockRequirePermission }));
vi.mock("@/lib/rate-limit-memory", () => ({ checkRateLimit: mockRateLimit }));
vi.mock("@/lib/studio-access", () => ({ getManagedUserIdsForViewer: mockManaged, canManageIdentityAsOwner: mockCanManage }));

const p = vi.mocked(prisma, true);

const base = { identityId: "identity-1", name: "Sara Ben Ali", email: "Sara@Example.com", source: "CTA_FORM" as const };

function jsonReq(body: unknown, url = "http://localhost/api/leads", method = "POST") {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json", "x-forwarded-for": "9.9.9.9" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockReturnValue({ ok: true });
  mockManaged.mockResolvedValue(["owner-1", "client-1"]);
  p.identityProfile.findUnique.mockResolvedValue({ id: "identity-1", userId: "owner-1", name: "Atelier Nord" } as never);
  p.capsule.findFirst.mockResolvedValue({ id: "capsule-1", title: "Refonte de site" } as never);
  p.capsuleOption.findFirst.mockResolvedValue({ label: "Site vitrine" } as never);
  p.lead.findFirst.mockResolvedValue(null);
  p.lead.create.mockResolvedValue({ id: "lead-1" } as never);
  p.notification.create.mockResolvedValue({} as never);
});

describe("createPublicLead — validation", () => {
  it.each([
    [{ name: "S" }, "nom"],
    [{ email: undefined, phone: undefined }, "e-mail ou un téléphone"],
    [{ email: "not-an-email" }, "e-mail invalide"],
    [{ email: undefined, phone: "abc" }, "téléphone invalide"],
  ])("rejects %o", async (override, message) => {
    const result = await createPublicLead({ ...base, ...override });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(JSON.stringify(result)).toContain(message);
    expect(p.lead.create).not.toHaveBeenCalled();
  });

  it("accepts a phone-only lead", async () => {
    const result = await createPublicLead({ ...base, email: undefined, phone: "+216 22 333 444" });
    expect(result).toMatchObject({ ok: true });
  });

  it("returns 404 for an unknown profile", async () => {
    p.identityProfile.findUnique.mockResolvedValue(null);
    expect(await createPublicLead(base)).toMatchObject({ ok: false, status: 404 });
  });

  it("only accepts a published capsule of the same profile", async () => {
    p.capsule.findFirst.mockResolvedValue(null);
    const result = await createPublicLead({ ...base, capsuleId: "someone-elses-capsule" });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(p.capsule.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "someone-elses-capsule", identityId: "identity-1", isPublished: true } }),
    );
  });

  it("rejects an option that is not part of the capsule", async () => {
    p.capsuleOption.findFirst.mockResolvedValue(null);
    const result = await createPublicLead({ ...base, capsuleId: "capsule-1", optionId: "foreign-option" });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });
});

describe("createPublicLead — creation", () => {
  it("stores the branch label read from the database and notifies the owner", async () => {
    const result = await createPublicLead({ ...base, capsuleId: "capsule-1", optionId: "option-1", message: "Budget 3k" });
    expect(result).toEqual({ ok: true, leadId: "lead-1", deduplicated: false });
    expect(p.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "owner-1",
          email: "sara@example.com",
          capsuleId: "capsule-1",
          branchLabel: "Site vitrine",
          source: "CTA_FORM",
        }),
      }),
    );
    expect(p.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "owner-1", type: "NEW_LEAD", body: expect.stringContaining("Refonte de site") }) }),
    );
  });

  it("merges a repeat submission from the same contact within 24h (no duplicate, no new alert)", async () => {
    p.lead.findFirst.mockResolvedValue({ id: "lead-0", message: "Premier message", messageId: null } as never);
    const result = await createPublicLead({ ...base, message: "Deuxième message" });
    expect(result).toEqual({ ok: true, leadId: "lead-0", deduplicated: true });
    expect(p.lead.create).not.toHaveBeenCalled();
    expect(p.notification.create).not.toHaveBeenCalled();
    expect(p.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ message: expect.stringContaining("Deuxième message") }) }),
    );
  });
});

describe("POST /api/leads (public)", () => {
  it("silently drops bot submissions (honeypot filled)", async () => {
    const res = await POST(jsonReq({ ...base, website: "http://spam.example" }));
    expect(res.status).toBe(201);
    expect(p.lead.create).not.toHaveBeenCalled();
  });

  it("is rate limited per IP", async () => {
    mockRateLimit.mockReturnValue({ ok: false, retryAfterMs: 60_000 });
    const res = await POST(jsonReq(base));
    expect(res.status).toBe(429);
    expect(mockRateLimit).toHaveBeenCalledWith("lead-create:9.9.9.9", expect.any(Number), expect.any(Number));
  });

  it("ignores a client-supplied source", async () => {
    await POST(jsonReq({ ...base, source: "ADMIN_IMPORT" }));
    expect(p.lead.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ source: "CTA_FORM" }) }));
  });
});

describe("GET / PATCH /api/leads (dashboard)", () => {
  beforeEach(() => {
    mockRequirePermission.mockResolvedValue({ userId: "owner-1" });
    p.lead.findMany.mockResolvedValue([]);
    p.lead.groupBy.mockResolvedValue([{ status: "NEW", _count: { _all: 2 } }, { status: "WON", _count: { _all: 1 } }] as never);
  });

  it("returns 401 without a session and 403 without the permission", async () => {
    mockRequirePermission.mockResolvedValue(null);
    mockGetAuth.mockResolvedValue(null);
    expect((await GET(new Request("http://localhost/api/leads"))).status).toBe(401);
    mockGetAuth.mockResolvedValue({ userId: "x" });
    expect((await GET(new Request("http://localhost/api/leads"))).status).toBe(403);
  });

  it("includes the leads of managed Studio clients and returns per-status counts", async () => {
    const res = await GET(new Request("http://localhost/api/leads?status=NEW&q=sara"));
    const json = await res.json();
    const args = p.lead.findMany.mock.calls[0]![0] as { where: Record<string, unknown> };
    expect(args.where.userId).toEqual({ in: ["owner-1", "client-1"] });
    expect(args.where.status).toBe("NEW");
    expect(json.counts).toEqual({ NEW: 2, CONTACTED: 0, QUALIFIED: 0, WON: 1, LOST: 0 });
  });

  it("rejects an invalid status", async () => {
    expect((await PATCH(jsonReq({ id: "lead-1", status: "DELETED" }, undefined, "PATCH"))).status).toBe(400);
  });

  it("cannot update a lead the caller does not manage", async () => {
    p.lead.findUnique.mockResolvedValue({ id: "lead-1", userId: "stranger" } as never);
    mockCanManage.mockResolvedValue(false);
    expect((await PATCH(jsonReq({ id: "lead-1", status: "WON" }, undefined, "PATCH"))).status).toBe(404);
    expect(p.lead.update).not.toHaveBeenCalled();
  });

  it("updates a managed lead", async () => {
    p.lead.findUnique.mockResolvedValue({ id: "lead-1", userId: "client-1" } as never);
    mockCanManage.mockResolvedValue(true);
    p.lead.update.mockResolvedValue({ id: "lead-1", status: "WON" } as never);
    expect((await PATCH(jsonReq({ id: "lead-1", status: "WON" }, undefined, "PATCH"))).status).toBe(200);
  });
});

describe("POST /api/messages — contact form feeds the pipeline", () => {
  it("creates a CONTACT_FORM lead linked to the message", async () => {
    p.identityProfile.findUnique.mockResolvedValue({ id: "identity-1", userId: "owner-1", name: "Atelier Nord" } as never);
    p.message.create.mockResolvedValue({ id: "message-1" } as never);
    const res = await postMessage(jsonReq({ identityId: "identity-1", name: "Sara", email: "sara@example.com", content: "Bonjour" }, "http://localhost/api/messages"));
    expect(res.status).toBe(201);
    expect(p.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ source: "CONTACT_FORM", messageId: "message-1" }) }),
    );
  });

  it("drops bot submissions on the contact form too", async () => {
    const res = await postMessage(jsonReq({ identityId: "identity-1", name: "Bot", email: "b@b.co", content: "spam", website: "x" }, "http://localhost/api/messages"));
    expect(res.status).toBe(201);
    expect(p.message.create).not.toHaveBeenCalled();
  });
});
