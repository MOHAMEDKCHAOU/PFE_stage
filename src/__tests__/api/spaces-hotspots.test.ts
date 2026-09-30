import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createHotspot, deleteHotspot, updateHotspot } from "@/route-handlers/api/spaces/hotspots";

const mockRequirePermission = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    smartSpace: { findFirst: vi.fn() },
    smartSpaceScene: { findFirst: vi.fn() },
    smartSpaceHotspot: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({ requirePermission: mockRequirePermission }));

const mockSpace = vi.mocked(prisma.smartSpace);
const mockScene = vi.mocked(prisma.smartSpaceScene);
const mockHotspot = vi.mocked(prisma.smartSpaceHotspot);

function req(body: unknown) {
  return new Request("http://localhost/api/spaces/space-1/hotspots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const base = { label: "Voir le projet", yaw: 10, pitch: 5 };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequirePermission.mockResolvedValue({ userId: "owner-1" });
  mockSpace.findFirst.mockResolvedValue({ id: "space-1", scenes: [{ id: "scene-1" }, { id: "scene-2" }] } as never);
  mockScene.findFirst.mockResolvedValue(null);
  mockHotspot.create.mockImplementation((async (args: { data: object }) => ({ id: "h1", ...args.data })) as never);
  mockHotspot.update.mockImplementation((async (args: { data: object }) => ({ id: "h1", ...args.data })) as never);
});

describe("POST /api/spaces/[id]/hotspots", () => {
  it("requires authentication", async () => {
    mockRequirePermission.mockResolvedValue(null);
    expect((await createHotspot(req({ ...base, type: "INFO" }), "space-1")).status).toBe(401);
  });

  it("only works on the caller's own Space", async () => {
    mockSpace.findFirst.mockResolvedValue(null);
    const res = await createHotspot(req({ ...base, type: "INFO" }), "someone-elses-space");
    expect(res.status).toBe(404);
    expect(mockSpace.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "someone-elses-space", userId: "owner-1" } }),
    );
  });

  it.each(["javascript:alert(document.cookie)", "JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.com", "https://a.com@evil.com"])(
    "rejects unsafe targetUrl %s",
    async (targetUrl) => {
      const res = await createHotspot(req({ ...base, type: "LINK", targetUrl }), "space-1");
      expect(res.status).toBe(400);
      expect(mockHotspot.create).not.toHaveBeenCalled();
    },
  );

  it("stores the normalized safe URL", async () => {
    const res = await createHotspot(req({ ...base, type: "LINK", targetUrl: "  https://example.com  " }), "space-1");
    expect(res.status).toBe(201);
    expect(mockHotspot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ targetUrl: "https://example.com/", sceneId: "scene-1" }),
    });
  });

  it("requires a link for LINK / CTA / VIDEO", async () => {
    expect((await createHotspot(req({ ...base, type: "CTA" }), "space-1")).status).toBe(400);
  });

  it("refuses a link on an INFO hotspot", async () => {
    const res = await createHotspot(req({ ...base, type: "INFO", targetUrl: "https://example.com" }), "space-1");
    expect(res.status).toBe(400);
  });

  it("refuses a target scene from another Space", async () => {
    mockScene.findFirst.mockResolvedValue(null);
    const res = await createHotspot(req({ ...base, type: "NAVIGATION", targetSceneId: "foreign-scene" }), "space-1");
    expect(res.status).toBe(400);
    expect(mockScene.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "foreign-scene", spaceId: "space-1" } }),
    );
    expect(mockHotspot.create).not.toHaveBeenCalled();
  });

  it("accepts a target scene of the same Space", async () => {
    mockScene.findFirst.mockResolvedValue({ id: "scene-2" } as never);
    const res = await createHotspot(req({ ...base, type: "NAVIGATION", targetSceneId: "scene-2" }), "space-1");
    expect(res.status).toBe(201);
  });

  it("refuses a sceneId that is not in the Space", async () => {
    const res = await createHotspot(req({ ...base, type: "INFO", sceneId: "foreign-scene" }), "space-1");
    expect(res.status).toBe(400);
  });

  it("clamps yaw / pitch and requires them", async () => {
    await createHotspot(req({ label: "x", type: "INFO", yaw: 999, pitch: -999 }), "space-1");
    expect(mockHotspot.create).toHaveBeenCalledWith({ data: expect.objectContaining({ yaw: 180, pitch: -90 }) });
    expect((await createHotspot(req({ label: "x", type: "INFO" }), "space-1")).status).toBe(400);
  });
});

describe("PATCH / DELETE /api/spaces/[id]/hotspots/[hotspotId]", () => {
  const existing = {
    id: "h1",
    sceneId: "scene-1",
    label: "Shop",
    type: "LINK",
    yaw: 0,
    pitch: 0,
    targetUrl: "https://example.com/",
    targetSceneId: null,
    metadata: null,
  };

  it("only edits a hotspot of the caller's own Space", async () => {
    mockHotspot.findFirst.mockResolvedValue(null);
    const res = await updateHotspot(req({ label: "x" }), "space-1", "h1");
    expect(res.status).toBe(404);
    expect(mockHotspot.findFirst).toHaveBeenCalledWith({
      where: { id: "h1", scene: { spaceId: "space-1", space: { userId: "owner-1" } } },
    });
  });

  it("rejects an unsafe URL on update", async () => {
    mockHotspot.findFirst.mockResolvedValue(existing as never);
    const res = await updateHotspot(req({ targetUrl: "javascript:alert(1)" }), "space-1", "h1");
    expect(res.status).toBe(400);
    expect(mockHotspot.update).not.toHaveBeenCalled();
  });

  it("validates the merged state (removing the URL of a LINK is refused)", async () => {
    mockHotspot.findFirst.mockResolvedValue(existing as never);
    expect((await updateHotspot(req({ targetUrl: null }), "space-1", "h1")).status).toBe(400);
  });

  it("updates a valid change", async () => {
    mockHotspot.findFirst.mockResolvedValue(existing as never);
    const res = await updateHotspot(req({ label: "Boutique" }), "space-1", "h1");
    expect(res.status).toBe(200);
    expect(mockHotspot.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "h1" }, data: expect.objectContaining({ label: "Boutique" }) }),
    );
  });

  it("deletes only an owned hotspot", async () => {
    mockHotspot.findFirst.mockResolvedValue(null);
    expect((await deleteHotspot(req({}), "space-1", "h1")).status).toBe(404);
    expect(mockHotspot.delete).not.toHaveBeenCalled();

    mockHotspot.findFirst.mockResolvedValue(existing as never);
    expect((await deleteHotspot(req({}), "space-1", "h1")).status).toBe(200);
    expect(mockHotspot.delete).toHaveBeenCalledWith({ where: { id: "h1" } });
  });
});
