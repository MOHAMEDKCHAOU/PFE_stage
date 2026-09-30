import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

/** Alphabet sans caractères ambigus (0/O, 1/I/L) — lisible sur un flyer ou dicté par téléphone. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;
const CODE_RE = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);

export const AGENCY_NAME_MAX = 80;

export function generatePartnerCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** Accepte « k7f9-qx2m », « K7F9QX2M »… ; renvoie la forme stockée ou null. */
export function normalizePartnerCode(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return CODE_RE.test(code) ? code : null;
}

/** Forme affichée : XXXX-XXXX */
export function formatPartnerCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function partnerJoinPath(code: string): string {
  return `/join/${formatPartnerCode(code)}`;
}

/** Logo : uniquement un fichier déjà uploadé sur la plateforme (pas d’URL externe arbitraire). */
export function isSafeLogoUrl(url: string): boolean {
  return /^\/uploads\/[A-Za-z0-9/_.-]+$/.test(url) && !url.includes("..");
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "***";
  return `${local[0]}***@${domain}`;
}

function isUniqueViolation(e: unknown): boolean {
  return Boolean(e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002");
}

/** Profil partenaire de l’affilié, créé avec un code unique à la première demande. */
export async function getOrCreatePartnerProfile(affiliateUserId: string) {
  const existing = await prisma.studioPartnerProfile.findUnique({ where: { affiliateUserId } });
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.studioPartnerProfile.create({
        data: { affiliateUserId, code: generatePartnerCode() },
      });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      // Création concurrente pour le même affilié : renvoyer la ligne gagnante.
      const raced = await prisma.studioPartnerProfile.findUnique({ where: { affiliateUserId } });
      if (raced) return raced;
      // Sinon collision de code (très improbable) : nouvel essai.
    }
  }
  throw new Error("Impossible de générer un code partenaire unique");
}

/** Nouveau code : l’ancien QR cesse immédiatement de fonctionner. */
export async function rotatePartnerCode(affiliateUserId: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.studioPartnerProfile.update({
        where: { affiliateUserId },
        data: { code: generatePartnerCode(), rotatedAt: new Date() },
      });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  throw new Error("Impossible de générer un code partenaire unique");
}
