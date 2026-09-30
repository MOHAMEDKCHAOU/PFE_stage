import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * Stockage local des médias (public/uploads). Point unique d’accès au disque pour
 * pouvoir brancher plus tard un stockage objet (S3 / R2) sans toucher aux routes.
 */

export const UPLOAD_TYPES = ["avatar", "cover", "portfolio", "library", "asset", "logo"] as const;
export type UploadType = (typeof UPLOAD_TYPES)[number];

const FOLDER_BY_TYPE: Record<UploadType, string> = {
  avatar: "avatars",
  cover: "covers",
  portfolio: "portfolio",
  library: "library",
  asset: "library",
  logo: "logos",
};

/** Origine enregistrée sur UserAsset (affichée dans la bibliothèque). */
export const SOURCE_BY_TYPE: Record<UploadType, string> = {
  avatar: "AVATAR",
  cover: "COVER",
  portfolio: "PORTFOLIO",
  library: "LIBRARY",
  asset: "LIBRARY",
  logo: "LOGO",
};

export function parseUploadType(raw: unknown): UploadType {
  return UPLOAD_TYPES.includes(raw as UploadType) ? (raw as UploadType) : "library";
}

function uploadRoot() {
  return path.join(process.cwd(), "public", "uploads");
}

const UPLOAD_URL_RE = /^\/uploads\/[a-z0-9-]+(?:\/[A-Za-z0-9-]+)*\/[A-Za-z0-9._-]+$/;

/** Chemin disque d’une URL /uploads/… ; null si l’URL sort du dossier (anti path traversal). */
export function resolveUploadFile(url: string): string | null {
  if (!UPLOAD_URL_RE.test(url) || url.includes("..")) return null;
  const root = uploadRoot();
  const absolute = path.resolve(root, url.slice("/uploads/".length));
  return absolute.startsWith(root + path.sep) ? absolute : null;
}

/** Nom aléatoire choisi par le serveur : ni nom d’origine, ni identifiant utilisateur. */
export async function saveUpload(type: UploadType, ext: string, data: Uint8Array): Promise<string> {
  const folder = FOLDER_BY_TYPE[type];
  const dir = path.join(uploadRoot(), folder);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), data);
  return `/uploads/${folder}/${filename}`;
}

/** Supprime le fichier ; ignore un fichier déjà absent. */
export async function deleteUploadFile(url: string): Promise<void> {
  const file = resolveUploadFile(url);
  if (!file) return;
  await unlink(file).catch((e: NodeJS.ErrnoException) => {
    if (e.code !== "ENOENT") throw e;
  });
}
