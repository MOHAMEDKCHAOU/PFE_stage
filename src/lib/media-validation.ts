import type { UserAssetKind } from "@/generated/prisma";

/**
 * Détection du VRAI type d’un fichier à partir de son contenu (signature / « magic bytes »).
 * Le nom de fichier et le type MIME envoyés par le navigateur ne sont jamais utilisés pour
 * choisir l’extension enregistrée : un « image.png » qui contient du HTML est refusé.
 */

export const MAX_BYTES: Record<UserAssetKind, number> = {
  IMAGE: 5 * 1024 * 1024,
  VIDEO: 80 * 1024 * 1024,
  MODEL_3D: 40 * 1024 * 1024,
};

export type DetectedMedia = {
  kind: UserAssetKind;
  /** Extension choisie par le serveur */
  ext: "jpg" | "png" | "gif" | "webp" | "mp4" | "mov" | "webm" | "glb" | "gltf" | "obj";
  mime: string;
};

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((b, i) => bytes[offset + i] === b);
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, Math.min(end, bytes.length)));
}

function looksLikeText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, 64 * 1024);
  for (const b of sample) {
    if (b === 0) return false;
  }
  return true;
}

const OBJ_LINE = /^(#|v |vn |vt |vp |f |l |o |g |s |mtllib |usemtl )/;

function isWavefrontObj(bytes: Uint8Array): boolean {
  if (!looksLikeText(bytes)) return false;
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 64 * 1024));
  if (/<\s*(script|html|svg|iframe|body)/i.test(text)) return false;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  const valid = lines.filter((l) => OBJ_LINE.test(l)).length;
  return lines.some((l) => l.startsWith("v ")) && valid / lines.length > 0.9;
}

function isGltfJson(bytes: Uint8Array): boolean {
  if (!looksLikeText(bytes)) return false;
  try {
    const json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return Boolean(json && typeof json === "object" && !Array.isArray(json) && typeof json.asset === "object");
  } catch {
    return false;
  }
}

/**
 * @param filename utilisé UNIQUEMENT pour départager les formats texte 3D (.obj / .gltf),
 *                 jamais pour choisir le type d’un fichier binaire.
 */
export function detectMedia(bytes: Uint8Array, filename = ""): DetectedMedia | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { kind: "IMAGE", ext: "jpg", mime: "image/jpeg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { kind: "IMAGE", ext: "png", mime: "image/png" };
  }
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") {
    return { kind: "IMAGE", ext: "gif", mime: "image/gif" };
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return { kind: "IMAGE", ext: "webp", mime: "image/webp" };
  }
  if (ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12);
    return brand === "qt  "
      ? { kind: "VIDEO", ext: "mov", mime: "video/quicktime" }
      : { kind: "VIDEO", ext: "mp4", mime: "video/mp4" };
  }
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: "VIDEO", ext: "webm", mime: "video/webm" };
  if (ascii(bytes, 0, 4) === "glTF") return { kind: "MODEL_3D", ext: "glb", mime: "model/gltf-binary" };

  const lowerName = filename.toLowerCase();
  if (lowerName.endsWith(".gltf") && isGltfJson(bytes)) {
    return { kind: "MODEL_3D", ext: "gltf", mime: "model/gltf+json" };
  }
  if (lowerName.endsWith(".obj") && isWavefrontObj(bytes)) {
    return { kind: "MODEL_3D", ext: "obj", mime: "model/obj" };
  }
  return null;
}

export const UNSUPPORTED_FORMAT_ERROR =
  "Format non supporté ou fichier corrompu (images JPG/PNG/WebP/GIF, vidéos MP4/WebM/MOV, 3D GLB/GLTF/OBJ).";

export function formatMaxSize(kind: UserAssetKind): string {
  return `${Math.round(MAX_BYTES[kind] / (1024 * 1024))} Mo`;
}
