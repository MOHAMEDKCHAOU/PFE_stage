import { prisma } from "@/lib/prisma";

/**
 * Création de leads depuis les pages publiques (formulaire CTA, formulaire de contact).
 * Toutes les données « de contexte » (capsule, branche) sont revérifiées côté serveur :
 * le client n’envoie que des identifiants, jamais de libellé libre.
 */

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Sources acceptées depuis l’extérieur (les anciennes valeurs restent lisibles). */
export const PUBLIC_LEAD_SOURCES = ["CTA_FORM", "CONTACT_FORM"] as const;
export type PublicLeadSource = (typeof PUBLIC_LEAD_SOURCES)[number];

/** Un même contact qui renvoie le formulaire dans ce délai met à jour son lead au lieu d’en créer un autre. */
export const LEAD_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ().-]{6,24}$/;

export type LeadInput = {
  identityId: unknown;
  name: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  capsuleId?: unknown;
  optionId?: unknown;
  source: PublicLeadSource;
  messageId?: string;
};

export type LeadResult =
  | { ok: true; leadId: string; deduplicated: boolean }
  | { ok: false; status: number; error: string };

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v ? v.slice(0, max) : null;
}

export async function createPublicLead(input: LeadInput): Promise<LeadResult> {
  const name = text(input.name, 120);
  const email = text(input.email, 180)?.toLowerCase() ?? null;
  const phone = text(input.phone, 24);
  const message = text(input.message, 2000);

  if (!name || name.length < 2) return { ok: false, status: 400, error: "Indiquez votre nom (2 caractères minimum)." };
  if (!email && !phone) return { ok: false, status: 400, error: "Indiquez un e-mail ou un téléphone pour être recontacté." };
  if (email && !EMAIL_RE.test(email)) return { ok: false, status: 400, error: "Adresse e-mail invalide." };
  if (phone && !PHONE_RE.test(phone)) return { ok: false, status: 400, error: "Numéro de téléphone invalide." };
  if (typeof input.identityId !== "string") return { ok: false, status: 400, error: "Profil introuvable." };

  const identity = await prisma.identityProfile.findUnique({
    where: { id: input.identityId },
    select: { id: true, userId: true, name: true },
  });
  if (!identity) return { ok: false, status: 404, error: "Profil introuvable." };

  // Capsule / branche : doivent appartenir à ce profil et être publiques.
  let capsuleId: string | null = null;
  let branchLabel: string | null = null;
  let capsuleTitle: string | null = null;
  if (input.capsuleId !== undefined && input.capsuleId !== null) {
    if (typeof input.capsuleId !== "string") return { ok: false, status: 400, error: "Capsule invalide." };
    const capsule = await prisma.capsule.findFirst({
      where: { id: input.capsuleId, identityId: identity.id, isPublished: true },
      select: { id: true, title: true },
    });
    if (!capsule) return { ok: false, status: 400, error: "Capsule invalide." };
    capsuleId = capsule.id;
    capsuleTitle = capsule.title;

    if (input.optionId !== undefined && input.optionId !== null) {
      if (typeof input.optionId !== "string") return { ok: false, status: 400, error: "Option invalide." };
      const option = await prisma.capsuleOption.findFirst({
        where: { id: input.optionId, capsuleId: capsule.id },
        select: { label: true },
      });
      if (!option) return { ok: false, status: 400, error: "Option invalide." };
      branchLabel = option.label;
    }
  }

  // Même contact récemment : on complète le lead existant (pas de doublon, pas de nouvelle alerte).
  const since = new Date(Date.now() - LEAD_DEDUPE_WINDOW_MS);
  const existing = await prisma.lead.findFirst({
    where: {
      identityId: identity.id,
      createdAt: { gte: since },
      OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, message: true, messageId: true },
  });

  if (existing) {
    const merged = message && message !== existing.message ? [existing.message, message].filter(Boolean).join("\n\n—\n\n") : existing.message;
    await prisma.lead.update({
      where: { id: existing.id },
      data: {
        name,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        message: merged?.slice(0, 4000) ?? null,
        ...(capsuleId ? { capsuleId, branchLabel } : {}),
        ...(input.messageId && !existing.messageId ? { messageId: input.messageId } : {}),
      },
    });
    return { ok: true, leadId: existing.id, deduplicated: true };
  }

  const lead = await prisma.lead.create({
    data: {
      userId: identity.userId,
      identityId: identity.id,
      name,
      email,
      phone,
      message,
      source: input.source,
      capsuleId,
      branchLabel,
      messageId: input.messageId ?? null,
    },
    select: { id: true },
  });

  const context = capsuleTitle ? ` via « ${capsuleTitle} »${branchLabel ? ` → ${branchLabel}` : ""}` : "";
  await prisma.notification
    .create({
      data: {
        userId: identity.userId,
        type: "NEW_LEAD",
        title: "🎯 Nouveau lead",
        body: `${name} souhaite être recontacté${context}.`,
        link: "/dashboard/leads",
      },
    })
    .catch(() => undefined);

  return { ok: true, leadId: lead.id, deduplicated: false };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}
