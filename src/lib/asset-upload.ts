import type { UserAssetKind } from "@prisma/client";

export type ClassifiedUpload =
  | { ok: true; kind: UserAssetKind; maxBytes: number }
  | { ok: false; error: string };

const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 80 * 1024 * 1024;
const MODEL_MAX = 40 * 1024 * 1024;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const VIDEO_MIMES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MODEL_MIMES = new Set(["model/gltf-binary", "model/gltf+json"]);

export function classifyUploadFile(file: File): ClassifiedUpload {
  const mime = (file.type || "").toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (IMAGE_MIMES.has(mime) || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    if (!mime.startsWith("image/") && !["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      return { ok: false, error: "Format image non supporté" };
    }
    return { ok: true, kind: "IMAGE", maxBytes: IMAGE_MAX };
  }

  if (VIDEO_MIMES.has(mime) || ["mp4", "webm", "mov"].includes(ext)) {
    if (!mime.startsWith("video/") && !["mp4", "webm", "mov"].includes(ext)) {
      return { ok: false, error: "Format vidéo non supporté" };
    }
    return { ok: true, kind: "VIDEO", maxBytes: VIDEO_MAX };
  }

  if (
    MODEL_MIMES.has(mime) ||
    ["glb", "gltf", "obj"].includes(ext) ||
    mime === "application/octet-stream"
  ) {
    if (["glb", "gltf", "obj"].includes(ext) || MODEL_MIMES.has(mime)) {
      return { ok: true, kind: "MODEL_3D", maxBytes: MODEL_MAX };
    }
  }

  return {
    ok: false,
    error: "Format non supporté (images, vidéos MP4/WebM/MOV, GLB/GLTF/OBJ)",
  };
}

export function shouldRecordUserAsset(uploadType: string | null): boolean {
  return uploadType === "portfolio" || uploadType === "library" || uploadType === "asset";
}
