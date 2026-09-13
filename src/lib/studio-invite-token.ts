import { createHash, randomBytes } from "crypto";

const TOKEN_BYTES = 32;

export function generateInviteToken(): { raw: string; tokenHash: string } {
  const raw = randomBytes(TOKEN_BYTES).toString("base64url");
  const tokenHash = createHash("sha256").update(raw, "utf8").digest("hex");
  return { raw, tokenHash };
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw.trim(), "utf8").digest("hex");
}

/** Longueur minimale du jeton brut (base64url 32 octets ≈ 43 caractères) */
export function isValidInviteTokenShape(raw: string): boolean {
  const t = raw.trim();
  return t.length >= 40 && t.length <= 200 && /^[A-Za-z0-9_-]+$/.test(t);
}
