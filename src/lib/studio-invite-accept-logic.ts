import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { normalizeStudioClientEmail } from "@/lib/studio-client-email";
import { hasPermission } from "@/lib/rbac-policy";
import { assertCanAddStudioClient } from "@/lib/subscription-guards";

class InviteNoLongerValidError extends Error {}

export type InviteAcceptRow = {
  id: string;
  affiliateUserId: string;
  inviteeEmail: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  acceptedAt: Date | null;
};

export type AcceptInviteResult =
  | { ok: true; message: string }
  | { ok: false; status: number; error: string };

function isExpired(invite: InviteAcceptRow, now: Date): boolean {
  return invite.expiresAt <= now;
}

/** Valide invitation + utilisateur ; exécute la liaison Studio (transaction). */
export async function acceptStudioInviteForSessionUser(
  invite: InviteAcceptRow,
  userId: string,
  now: Date = new Date(),
): Promise<AcceptInviteResult> {
  if (invite.revokedAt) {
    return { ok: false, status: 410, error: "Invitation annulée" };
  }
  if (invite.acceptedAt) {
    return { ok: false, status: 410, error: "Invitation déjà acceptée" };
  }
  if (isExpired(invite, now)) {
    return { ok: false, status: 410, error: "Invitation expirée" };
  }
  if (invite.affiliateUserId === userId) {
    return { ok: false, status: 400, error: "Vous ne pouvez pas accepter votre propre invitation" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  if (!user) {
    return { ok: false, status: 401, error: "Session invalide" };
  }

  if (hasPermission(user.role, "admin:stats:read")) {
    return {
      ok: false,
      status: 403,
      error: "Les comptes administrateur ne peuvent pas accepter une invitation client (espace commercial).",
    };
  }

  if (invite.inviteeEmail) {
    const targetEmail = normalizeStudioClientEmail(invite.inviteeEmail);
    const userEmail = normalizeStudioClientEmail(user.email);
    if (!targetEmail || !userEmail || userEmail !== targetEmail) {
      return {
        ok: false,
        status: 403,
        error:
          "Cette invitation est liée à une autre adresse e-mail. Connectez-vous avec le compte invité.",
      };
    }
  }

  // Le partenaire doit toujours être habilité au moment de l’acceptation (compte actif,
  // permission Studio, abonnement Studio et quota de clients), pas seulement à l’envoi.
  const affiliate = await prisma.user.findUnique({
    where: { id: invite.affiliateUserId },
    select: { role: true, status: true },
  });
  if (!affiliate || affiliate.status !== "ACTIVE" || !hasPermission(affiliate.role, "studio:access")) {
    return { ok: false, status: 410, error: "Ce partenaire n’est plus habilité à gérer des comptes clients." };
  }
  if (await assertCanAddStudioClient(invite.affiliateUserId)) {
    return {
      ok: false,
      status: 409,
      error: "Ce partenaire ne peut pas accepter de nouveaux clients pour le moment.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Consommation atomique : une invitation ne peut être acceptée qu’une seule fois,
      // même en cas de requêtes concurrentes.
      const claimed = await tx.studioClientInvite.updateMany({
        where: { id: invite.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { acceptedAt: new Date(), clientUserId: userId },
      });
      if (claimed.count !== 1) throw new InviteNoLongerValidError();

      await tx.affiliateClient.create({
        data: { affiliateUserId: invite.affiliateUserId, clientUserId: userId },
      });
    });

    await writeAuditLog({
      actorUserId: userId,
      action: "STUDIO_CLIENT_LINKED",
      targetType: "AffiliateClient",
      targetId: invite.affiliateUserId,
      metadata: { inviteId: invite.id, affiliateUserId: invite.affiliateUserId, clientUserId: userId },
    });

    return { ok: true, message: "Lien accepté. Votre compte est rattaché à l’espace commercial du partenaire." };
  } catch (e: unknown) {
    if (e instanceof InviteNoLongerValidError) {
      return { ok: false, status: 410, error: "Invitation déjà utilisée, annulée ou expirée" };
    }
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2002") {
      return {
        ok: false,
        status: 409,
        error: "Vous êtes déjà lié à ce partenaire ou l’invitation est sans effet.",
      };
    }
    console.error("STUDIO INVITE ACCEPT TX", e);
    return { ok: false, status: 500, error: "Erreur serveur" };
  }
}
