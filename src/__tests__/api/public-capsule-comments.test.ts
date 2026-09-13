import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import * as notify from "@/lib/capsule-comment-notify";
import * as rate from "@/lib/rate-limit-memory";
import { getPublicCapsuleComments, postPublicCapsuleComment } from "@/route-handlers/api/capsules/public-comments-handlers";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    capsule: { findUnique: vi.fn() },
    capsuleComment: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/capsule-comment-notify", () => ({
  notifyOwnerNewCapsuleComment: vi.fn(),
}));

vi.mock("@/lib/rate-limit-memory", () => ({
  checkRateLimit: vi.fn(),
}));

const mockCapsule = vi.mocked(prisma.capsule);
const mockComment = vi.mocked(prisma.capsuleComment);
const mockNotify = vi.mocked(notify.notifyOwnerNewCapsuleComment);
const mockRate = vi.mocked(rate.checkRateLimit);

describe("getPublicCapsuleComments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("403 si commentaires désactivés", async () => {
    mockCapsule.findUnique.mockResolvedValue({
      commentsEnabled: false,
      isPublished: true,
      title: "T",
      identity: { slug: "sl" },
    } as never);

    const res = await getPublicCapsuleComments("cap-1");
    expect(res.status).toBe(403);
  });

  it("200 avec items sans e-mail", async () => {
    mockCapsule.findUnique.mockResolvedValue({
      commentsEnabled: true,
      isPublished: true,
      title: "T",
      identity: { slug: "sl" },
    } as never);
    mockComment.findMany.mockResolvedValue([
      {
        id: "c1",
        authorName: "Ana",
        body: "Hello",
        createdAt: new Date("2020-01-01T12:00:00Z"),
        children: [],
      },
    ] as never);
    mockComment.count.mockResolvedValue(1);

    const res = await getPublicCapsuleComments("cap-1");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.totalApproved).toBe(1);
    expect(json.items[0]).toEqual({
      id: "c1",
      authorName: "Ana",
      body: "Hello",
      createdAt: "2020-01-01T12:00:00.000Z",
      reply: null,
    });
    expect(json.items[0].authorEmail).toBeUndefined();
  });
});

describe("postPublicCapsuleComment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("429 si rate limit", async () => {
    mockCapsule.findUnique.mockResolvedValue({
      commentsEnabled: true,
      isPublished: true,
      title: "T",
      identity: { userId: "u1", slug: "sl", name: "Id" },
    } as never);
    mockRate.mockReturnValue({ ok: false, retryAfterMs: 5000 });

    const req = new Request("http://localhost/api/c", {
      method: "POST",
      body: JSON.stringify({ authorName: "Bob", body: "Hi there" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postPublicCapsuleComment(req, "cap-1");
    expect(res.status).toBe(429);
    expect(mockComment.create).not.toHaveBeenCalled();
  });

  it("200 crée PENDING et notifie", async () => {
    mockCapsule.findUnique.mockResolvedValue({
      commentsEnabled: true,
      isPublished: true,
      title: "Ma cap",
      identity: { userId: "owner-1", slug: "sl", name: "Studio" },
    } as never);
    mockRate.mockReturnValue({ ok: true });
    mockComment.create.mockResolvedValue({
      id: "new-c",
      createdAt: new Date(),
    } as never);

    const req = new Request("http://localhost/api/c", {
      method: "POST",
      body: JSON.stringify({ authorName: "Bob", body: "Super capsule" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postPublicCapsuleComment(req, "cap-1");
    expect(res.status).toBe(200);
    expect(mockComment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          authorName: "Bob",
          body: "Super capsule",
        }),
      }),
    );
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: "owner-1",
        capsuleId: "cap-1",
        authorName: "Bob",
      }),
    );
  });
});
