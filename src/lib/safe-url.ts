/**
 * Validation des liens saisis par les créateurs et affichés aux visiteurs.
 * Liste blanche de schémas (jamais de liste noire) : tout ce qui n’est pas explicitement
 * autorisé est refusé (javascript:, data:, vbscript:, file:, blob:, …).
 * À utiliser à l’enregistrement ET à l’affichage (défense en profondeur).
 */

export const SAFE_URL_MAX_LENGTH = 800;

export type SafeUrl = {
  /** Valeur normalisée à utiliser comme href */
  href: string;
  kind: "web" | "mailto" | "tel" | "internal";
  /** true pour un lien qui quitte Faymoos (web externe) */
  external: boolean;
  /** Domaine affiché au visiteur (web uniquement) */
  host: string | null;
};

/** Espaces, caractères de contrôle et antislash : utilisés pour contourner les filtres de schéma. */
const FORBIDDEN_CHARS = /[\u0000-\u0020\u007F-\u00A0\u1680\u2000-\u200F\u2028\u2029\u202F\u205F\u3000\uFEFF\\]/;
const TEL_RE = /^tel:\+?[0-9().-]{3,32}$/i;
const INTERNAL_BASE = "https://internal.faymoos.invalid";

export function parseSafeUrl(raw: unknown): SafeUrl | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value.length > SAFE_URL_MAX_LENGTH || FORBIDDEN_CHARS.test(value)) return null;

  // Chemin interne : "/capsule/x" — mais jamais "//evil.com" (URL relative au protocole).
  if (value.startsWith("/")) {
    if (value.startsWith("//")) return null;
    try {
      const url = new URL(value, INTERNAL_BASE);
      if (url.origin !== INTERNAL_BASE) return null;
      return { href: `${url.pathname}${url.search}${url.hash}`, kind: "internal", external: false, host: null };
    } catch {
      return null;
    }
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  switch (url.protocol) {
    case "https:":
    case "http:":
      // "https://faymoos.com@evil.com" : identifiants dans l’URL = technique d’hameçonnage classique.
      if (!url.hostname || url.username || url.password) return null;
      return { href: url.href, kind: "web", external: true, host: url.hostname };
    case "mailto:":
      if (value.length <= "mailto:".length) return null;
      return { href: value, kind: "mailto", external: false, host: null };
    case "tel:":
      return TEL_RE.test(value) ? { href: value, kind: "tel", external: false, host: null } : null;
    default:
      return null;
  }
}
