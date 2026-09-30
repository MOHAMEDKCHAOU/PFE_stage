import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { detectMedia } from "@/lib/media-validation";
import { sanitizeImage, MAX_IMAGE_DIMENSION } from "@/lib/image-sanitize";
import { resolveUploadFile } from "@/lib/asset-storage";

async function image(format: "jpeg" | "png" | "webp" | "gif", width = 32, height = 24) {
  return sharp({ create: { width, height, channels: 3, background: { r: 200, g: 120, b: 40 } } })[format]().toBuffer();
}

const text = (s: string) => new TextEncoder().encode(s);

describe("detectMedia — type read from content, never from the name", () => {
  it.each([
    ["jpeg", "jpg"],
    ["png", "png"],
    ["webp", "webp"],
    ["gif", "gif"],
  ] as const)("detects a real %s", async (format, ext) => {
    expect(detectMedia(await image(format), "whatever.bin")?.ext).toBe(ext);
  });

  it("ignores a misleading file name: a PNG named .html is saved as .png", async () => {
    expect(detectMedia(await image("png"), "evil.html")).toMatchObject({ kind: "IMAGE", ext: "png" });
  });

  it.each([
    ["HTML disguised as PNG", "<html><script>alert(document.cookie)</script></html>", "photo.png"],
    ["SVG with script", '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "logo.svg"],
    ["plain text", "hello world", "notes.txt"],
    ["JavaScript", "alert(1)", "app.js"],
  ])("rejects %s", (_n, content, name) => {
    expect(detectMedia(text(content), name)).toBeNull();
  });

  it("detects MP4 / MOV / WebM / GLB by signature", () => {
    const mp4 = new Uint8Array([0, 0, 0, 24, ...text("ftypisom"), 0, 0, 0, 0]);
    const mov = new Uint8Array([0, 0, 0, 20, ...text("ftypqt  "), 0, 0, 0, 0]);
    const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]);
    const glb = new Uint8Array([...text("glTF"), 2, 0, 0, 0]);
    expect(detectMedia(mp4)?.ext).toBe("mp4");
    expect(detectMedia(mov)?.ext).toBe("mov");
    expect(detectMedia(webm)?.ext).toBe("webm");
    expect(detectMedia(glb)?.ext).toBe("glb");
  });

  it("accepts real GLTF / OBJ text, rejects fakes", () => {
    expect(detectMedia(text('{"asset":{"version":"2.0"}}'), "scene.gltf")?.ext).toBe("gltf");
    expect(detectMedia(text("# cube\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n"), "cube.obj")?.ext).toBe("obj");
    expect(detectMedia(text('{"not":"gltf"}'), "scene.gltf")).toBeNull();
    expect(detectMedia(text("v 0 0 0\n<script>alert(1)</script>\n"), "cube.obj")).toBeNull();
    // Du texte OBJ valide n’est accepté que sous une extension .obj.
    expect(detectMedia(text("v 0 0 0\nf 1 1 1\n"), "cube.png")).toBeNull();
  });
});

describe("sanitizeImage — metadata removed, image normalized", () => {
  it("strips EXIF (including GPS) from a JPEG", async () => {
    const withExif = await sharp(await image("jpeg"))
      .withExif({ IFD0: { Copyright: "secret", Artist: "Someone" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "36/1 48/1 0/1" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const clean = await sanitizeImage(withExif, "jpg");
    const meta = await sharp(clean.buffer).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.xmp).toBeUndefined();
    expect(clean.buffer.includes(Buffer.from("secret"))).toBe(false);
  });

  it("applies the EXIF orientation before removing it", async () => {
    const rotated = await sharp(await image("jpeg", 40, 20)).withMetadata({ orientation: 6 }).jpeg().toBuffer();
    const clean = await sanitizeImage(rotated, "jpg");
    expect([clean.width, clean.height]).toEqual([20, 40]);
  });

  it("downsizes huge images", async () => {
    const huge = await image("png", MAX_IMAGE_DIMENSION + 500, 100);
    const clean = await sanitizeImage(huge, "png");
    expect(clean.width).toBe(MAX_IMAGE_DIMENSION);
  });

  it("rejects a corrupted image (valid signature, garbage body)", async () => {
    const fake = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("not really a jpeg".repeat(20))]);
    await expect(sanitizeImage(fake, "jpg")).rejects.toThrow();
  });
});

describe("resolveUploadFile — no path traversal", () => {
  it("accepts a normal upload URL", () => {
    expect(resolveUploadFile("/uploads/library/0b6f6c1e-8d3a-4c1f-9a53-2f7a1c9d1e22.png")).toMatch(/uploads[\\/]library/);
  });

  it.each([
    "/uploads/../.env",
    "/uploads/library/../../package.json",
    "/uploads/library/..%2F..%2F.env",
    "/etc/passwd",
    "https://evil.example/uploads/x.png",
    "/uploads/library/a b.png",
  ])("rejects %s", (url) => {
    expect(resolveUploadFile(url)).toBeNull();
  });
});
