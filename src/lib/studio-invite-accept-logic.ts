import { prisma } from "@/lib/prisma";
import { normalizeStudioClientEmail } from "@/lib/studio-client-email";

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

  if (user.role === "ADMIN") {
    return {
      ok: false,
      status: 403,
      error: "Les comptes administrateur ne peuvent pas accepter une invitation Studio client.",
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

  try {
    await prisma.$transaction([
      prisma.affiliateClient.create({
        data: { affiliateUserId: invite.affiliateUserId, clientUserId: userId },
      }),
      prisma.studioClientInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date(), clientUserId: userId },
      }),
    ]);

    return { ok: true, message: "Lien Studio accepté. Votre compte est rattaché." };
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2002") {
      return {
        ok: false,
        status: 409,
        error: "Vous êtes déjà lié à ce Studio ou l’invitation est sans effet.",
      };
    }
    console.error("STUDIO INVITE ACCEPT TX", e);
    return { ok: false, status: 500, error: "Erreur serveur" };
  }
}
