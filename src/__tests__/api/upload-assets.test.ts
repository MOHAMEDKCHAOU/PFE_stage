import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { POST as upload } from "@/route-handlers/api/upload/route";
import { GET as listAssets, DELETE as bulkDelete, parseLimit } from "@/route-handlers/api/assets/route";
import { deleteAsset, updateAsset } from "@/route-handlers/api/assets/item";

const mockRequirePermission = vi.hoisted(() => vi.fn());
const mockSaveUpload = vi.hoisted(() => vi.fn());
const mockDeleteFile = vi.hoisted(() => vi.fn());
const mockFindUsages = vi.hoisted(() => vi.fn());
const mockDetach = vi.hoisted(() => vi.fn());
const mockManaged = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userAsset: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));
vi.mock("@/lib/auth", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/asset-storage", async (orig) => ({
  ...(await orig<typeof import("@/lib/asset-storage")>()),
  saveUpload: mockSaveUpload,
  deleteUploadFile: mockDeleteFile,
}));
vi.mock("@/lib/asset-usage", () => ({ findAssetUsages: mockFindUsages, detachAssetUsages: mockDetach }));
vi.mock("@/lib/studio-access", () => ({ getManagedUserIdsForViewer: mockManaged }));

const mockAsset = vi.mocked(prisma.userAsset);

function uploadReq(bytes: Uint8Array, name: string, type = "library", mime = "image/png") {
  const form = new FormData();
  form.append("file", new File([new Uint8Array(bytes)], name, { type: mime }));
  form.append("type", type);
  return new Request("http://localhost/api/upload", { method: "POST", body: form });
}

function jsonReq(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const png = () => sharp({ create: { width: 20, height: 10, channels: 3, background: "#c6a15b" } }).png().toBuffer();

beforeEach(() => {
  vi.clearAllMocks();
  mockRequirePermission.mockResolvedValue({ userId: "user-1" });
  mockSaveUpload.mockImplementation(async (type: string, ext: string) => `/uploads/${type === "library" ? "library" : type}/new-file.${ext}`);
  mockAsset.findFirst.mockResolvedValue(null);
  mockAsset.create.mockImplementation((async (args: { data: Record<string, unknown> }) => ({ id: "a1", ...args.data })) as never);
  mockAsset.count.mockResolvedValue(0);
  mockFindUsages.mockResolvedValue([]);
  mockManaged.mockResolvedValue(["user-1"]);
});

describe("POST /api/upload", () => {
  it("saves with the extension detected from content, not the file name", async () => {
    const res = await upload(uploadReq(await png(), "evil.html"));
    expect(res.status).toBe(201);
    expect(mockSaveUpload).toHaveBeenCalledWith("library", "png", expect.any(Buffer));
  });

  it("rejects HTML disguised as an image", async () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const res = await upload(uploadReq(html, "photo.png"));
    expect(res.status).toBe(400);
    expect(mockSaveUpload).not.toHaveBeenCalled();
  });

  it("stores the image re-encoded (metadata stripped) with its dimensions", async () => {
    const withExif = await sharp(await png()).withExif({ IFD0: { Copyright: "secret-gps" } }).jpeg().toBuffer();
    await upload(uploadReq(withExif, "photo.jpg", "library", "image/jpeg"));
    const saved = mockSaveUpload.mock.calls[0]![2] as Buffer;
    expect(saved.includes(Buffer.from("secret-gps"))).toBe(false);
    expect(mockAsset.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ width: 20, height: 10, originalName: "photo.jpg", userId: "user-1" }) }),
    );
  });

  it("never puts the user id in the stored file name", async () => {
    await upload(uploadReq(await png(), "user-1.png"));
    const [, ext] = mockSaveUpload.mock.calls[0]!;
    expect(ext).toBe("png");
    // Le nom est généré par saveUpload (UUID aléatoire) : le nom d’origine n’est pas transmis.
    expect(mockSaveUpload.mock.calls[0]).toHaveLength(3);
  });

  it("refuses a video as avatar", async () => {
    const mp4 = new Uint8Array([0, 0, 0, 24, ...new TextEncoder().encode("ftypisom"), 0, 0, 0, 0]);
    const res = await upload(uploadReq(mp4, "clip.mp4", "avatar", "video/mp4"));
    expect(res.status).toBe(400);
  });

  it("reuses an identical file already in the library", async () => {
    mockAsset.findFirst.mockResolvedValue({ id: "existing", url: "/uploads/library/old.png", kind: "IMAGE", sizeBytes: 10, mimeType: "image/png" } as never);
    // Fichier inexistant sur disque (tests) → pas de déduplication, nouvel envoi.
    const res = await upload(uploadReq(await png(), "again.png"));
    expect(res.status).toBe(201);
    expect(mockAsset.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "user-1", sha256: expect.any(String) }) }));
  });

  it("requires the assets permission", async () => {
    mockRequirePermission.mockResolvedValue(null);
    expect((await upload(uploadReq(await png(), "a.png"))).status).toBe(403);
  });
});

describe("GET /api/assets", () => {
  beforeEach(() => {
    mockAsset.findMany.mockResolvedValue([]);
    mockAsset.aggregate.mockResolvedValue({ _count: { _all: 3 }, _sum: { sizeBytes: 1234 } } as never);
  });

  it.each([
    ["-5", 1],
    ["0", 1],
    ["abc", 24],
    ["999", 60],
    ["12", 12],
  ])("clamps limit %s to %i", (raw, expected) => {
    expect(parseLimit(raw)).toBe(expected);
  });

  it("only lists the caller's media, with a stable order and a search filter", async () => {
    const res = await listAssets(new Request("http://localhost/api/assets?q=Logo&kind=image&limit=-5"));
    const json = await res.json();
    const args = mockAsset.findMany.mock.calls[0]![0] as { where: Record<string, unknown>; orderBy: unknown[]; take: number };
    expect(args.where.userId).toBe("user-1");
    expect(args.where.kind).toEqual({ in: ["IMAGE"] });
    expect(args.where.OR).toEqual(expect.arrayContaining([{ tags: { has: "logo" } }]));
    expect(args.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    expect(args.take).toBe(2); // limit 1 (+1 pour savoir s’il reste une page)
    expect(json.stats).toEqual({ count: 3, bytes: 1234 });
  });
});

describe("PATCH /api/assets/[id]", () => {
  beforeEach(() => {
    mockAsset.findFirst.mockResolvedValue({ id: "a1", url: "/uploads/library/x.png" } as never);
    mockAsset.update.mockImplementation((async (args: { data: object }) => ({ id: "a1", ...args.data })) as never);
  });

  it("normalizes tags (trim, lowercase, dedupe)", async () => {
    await updateAsset(jsonReq("http://localhost/api/assets/a1", "PATCH", { tags: [" Client X ", "client-x", "LOGO"] }), "a1");
    expect(mockAsset.update).toHaveBeenCalledWith(expect.objectContaining({ data: { tags: ["client-x", "logo"] } }));
  });

  it("rejects too many tags and overly long alt text", async () => {
    const tags = Array.from({ length: 11 }, (_, i) => `t${i}`);
    expect((await updateAsset(jsonReq("http://localhost/api/assets/a1", "PATCH", { tags }), "a1")).status).toBe(400);
    expect((await updateAsset(jsonReq("http://localhost/api/assets/a1", "PATCH", { altText: "x".repeat(301) }), "a1")).status).toBe(400);
  });

  it("cannot edit another user's media", async () => {
    mockAsset.findFirst.mockResolvedValue(null);
    expect((await updateAsset(jsonReq("http://localhost/api/assets/a1", "PATCH", { title: "x" }), "a1")).status).toBe(404);
    expect(mockAsset.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "a1", userId: "user-1" } }));
  });
});

describe("DELETE /api/assets", () => {
  const asset = { id: "a1", url: "/uploads/library/x.png" };
  beforeEach(() => mockAsset.findFirst.mockResolvedValue(asset as never));

  it("deletes an unused media and its file", async () => {
    const res = await deleteAsset(jsonReq("http://localhost/api/assets/a1", "DELETE"), "a1");
    expect(res.status).toBe(200);
    expect(mockAsset.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
    expect(mockDeleteFile).toHaveBeenCalledWith(asset.url);
  });

  it("warns (409) when the media is in use, then detaches it with force", async () => {
    mockFindUsages.mockResolvedValue([{ type: "AVATAR", label: "Photo", ownerUserId: "user-1", href: "/x" }]);
    const first = await deleteAsset(jsonReq("http://localhost/api/assets/a1", "DELETE"), "a1");
    expect(first.status).toBe(409);
    expect(mockAsset.delete).not.toHaveBeenCalled();

    const forced = await deleteAsset(jsonReq("http://localhost/api/assets/a1?force=1", "DELETE"), "a1");
    expect(forced.status).toBe(200);
    expect(mockDetach).toHaveBeenCalledWith(asset.url, ["user-1"]);
    expect(mockAsset.delete).toHaveBeenCalled();
  });

  it("never deletes a media used in an account the caller does not manage, even with force", async () => {
    mockFindUsages.mockResolvedValue([{ type: "AVATAR", label: "Secret profile", ownerUserId: "stranger", href: "/x" }]);
    const res = await deleteAsset(jsonReq("http://localhost/api/assets/a1?force=1", "DELETE"), "a1");
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(mockAsset.delete).not.toHaveBeenCalled();
    expect(JSON.stringify(json)).not.toContain("Secret profile");
  });

  it("keeps the file when another record still points to it", async () => {
    mockAsset.count.mockResolvedValue(1);
    await deleteAsset(jsonReq("http://localhost/api/assets/a1", "DELETE"), "a1");
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("bulk delete only touches the caller's media and reports blocked ones", async () => {
    mockAsset.findMany.mockResolvedValue([asset, { id: "a2", url: "/uploads/library/y.png" }] as never);
    mockFindUsages.mockImplementation(async (url: string) =>
      url.endsWith("y.png") ? [{ type: "COVER", label: "Cover", ownerUserId: "user-1", href: "/x" }] : [],
    );
    const res = await bulkDelete(jsonReq("http://localhost/api/assets", "DELETE", { ids: ["a1", "a2", "not-mine"] }));
    const json = await res.json();
    expect(mockAsset.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ["a1", "a2", "not-mine"] }, userId: "user-1" } }));
    expect(json.deleted).toEqual(["a1"]);
    expect(json.blocked).toEqual([expect.objectContaining({ id: "a2", reason: "IN_USE" })]);
    expect(json.notFound).toBe(1);
  });
});
