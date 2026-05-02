import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { normalizeStudioClientEmail } from "@/lib/studio-client-email";
import { hashInviteToken, isValidInviteTokenShape } from "@/lib/studio-invite-token";
import { NextResponse } from "next/server";

const ACCEPT_LIMIT = 30;
const ACCEPT_WINDOW_MS = 60 * 60 * 1000;

/** POST — le client connecté accepte l’invitation */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  const limited = checkRateLimit(`studio-invite-accept:${userId}`, ACCEPT_LIMIT, ACCEPT_WINDOW_MS);
  if (!limited.ok) {
    const sec = Math.ceil(limited.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(sec) } },
    );
  }

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  if (!isValidInviteTokenShape(token)) {
    return NextResponse.json({ error: "Jeton invalide" }, { status: 400 });
  }

  const tokenHash = hashInviteToken(token);
  const invite = await prisma.studioClientInvite.findUnique({
    where: { tokenHash },
  });

  const now = new Date();
  if (!invite) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  if (invite.revokedAt) {
    return NextResponse.json({ error: "Invitation annulée" }, { status: 410 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Invitation déjà acceptée" }, { status: 410 });
  }

  if (invite.expiresAt <= now) {
    return NextResponse.json({ error: "Invitation expirée" }, { status: 410 });
  }

  if (invite.affiliateUserId === userId) {
    return NextResponse.json({ error: "Vous ne pouvez pas accepter votre propre invitation" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Les comptes administrateur ne peuvent pas accepter une invitation Studio client." },
      { status: 403 },
    );
  }

  if (invite.inviteeEmail) {
    const userEmail = normalizeStudioClientEmail(user.email);
    if (!userEmail || userEmail !== invite.inviteeEmail) {
      return NextResponse.json(
        {
          error:
            "Cette invitation est liée à une autre adresse e-mail. Connectez-vous avec le compte invité.",
        },
        { status: 403 },
      );
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

    return NextResponse.json({ success: true, message: "Lien Studio accepté. Votre compte est rattaché." });
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Vous êtes déjà lié à ce Studio ou l’invitation est sans effet." },
        { status: 409 },
      );
    }
    console.error("STUDIO INVITE ACCEPT", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
