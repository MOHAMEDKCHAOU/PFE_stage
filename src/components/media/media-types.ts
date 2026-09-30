export type MediaKind = "IMAGE" | "VIDEO" | "MODEL_3D";

export type MediaAsset = {
  id: string;
  url: string;
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  originalName: string | null;
  title: string | null;
  altText: string | null;
  tags: string[];
  width: number | null;
  height: number | null;
  source: string;
  createdAt: string;
};

export type KindFilter = "all" | "image" | "video" | "3d";
export type SortKey = "recent" | "oldest" | "name" | "size";
export type UploadType = "avatar" | "cover" | "portfolio" | "library" | "logo";

export type MediaUsage = { type: string; label: string; href: string | null; external: boolean };

export const KIND_TABS: { key: KindFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "image", label: "Images" },
  { key: "video", label: "Vidéos" },
  { key: "3d", label: "3D" },
];

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Plus récents" },
  { key: "oldest", label: "Plus anciens" },
  { key: "name", label: "Nom (A → Z)" },
  { key: "size", label: "Taille" },
];

export const SOURCE_LABEL: Record<string, string> = {
  LIBRARY: "Bibliothèque",
  AVATAR: "Photo de profil",
  COVER: "Couverture",
  PORTFOLIO: "Portfolio",
  LOGO: "Logo",
};

export const KIND_LABEL: Record<MediaKind, string> = { IMAGE: "Image", VIDEO: "Vidéo", MODEL_3D: "3D" };

/** Types acceptés par le sélecteur de fichiers (le serveur revérifie le contenu). */
export const ACCEPT_BY_KIND: Record<KindFilter, string> = {
  all: "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.glb,.gltf,.obj",
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  "3d": ".glb,.gltf,.obj",
};

export const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;

export function assetName(a: Pick<MediaAsset, "title" | "originalName">): string {
  return a.title || a.originalName || "Sans titre";
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
