import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac-policy";
import { assertCanAddStudioClient } from "@/lib/subscription-guards";

/**
 * Règles communes à toute création de lien Studio (invitation, demande via QR) :
 * un seul endroit pour éviter que les parcours divergent.
 */
export type LinkCheck = { ok: true } | { ok: false; status: number; error: string };

/** L’affilié doit être habilité au moment où le lien est créé (pas seulement à l’envoi). */
export async function checkAffiliateCanTakeClient(affiliateUserId: string): Promise<LinkCheck> {
  const affiliate = await prisma.user.findUnique({
    where: { id: affiliateUserId },
    select: { role: true, status: true },
  });
  if (!affiliate || affiliate.status !== "ACTIVE" || !hasPermission(affiliate.role, "studio:access")) {
    return { ok: false, status: 410, error: "Ce partenaire n’est plus habilité à gérer des comptes clients." };
  }
  if (await assertCanAddStudioClient(affiliateUserId)) {
    return { ok: false, status: 409, error: "Ce partenaire ne peut pas accepter de nouveaux clients pour le moment." };
  }
  return { ok: true };
}

/** Le compte client doit pouvoir être rattaché à cet affilié. */
export async function checkClientCanBeLinked(affiliateUserId: string, clientUserId: string): Promise<LinkCheck> {
  if (affiliateUserId === clientUserId) {
    return { ok: false, status: 400, error: "Vous ne pouvez pas vous rattacher à votre propre espace." };
  }
  const client = await prisma.user.findUnique({
    where: { id: clientUserId },
    select: { role: true, status: true },
  });
  if (!client || client.status !== "ACTIVE") {
    return { ok: false, status: 410, error: "Ce compte client n’est plus actif." };
  }
  if (hasPermission(client.role, "admin:stats:read")) {
    return {
      ok: false,
      status: 403,
      error: "Les comptes administrateur ne peuvent pas être rattachés comme clients.",
    };
  }
  const existing = await prisma.affiliateClient.findUnique({
    where: { affiliateUserId_clientUserId: { affiliateUserId, clientUserId } },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, status: 409, error: "Ce compte est déjà rattaché à ce partenaire." };
  }
  return { ok: true };
}
