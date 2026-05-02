import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { acceptStudioInviteForSessionUser } from "@/lib/studio-invite-accept-logic";
import { hashInviteToken, isValidInviteTokenShape } from "@/lib/studio-invite-token";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ACCEPT_LIMIT = 30;
const ACCEPT_WINDOW_MS = 60 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** POST — accepter une invitation (jeton du lien OU id pour invitations ciblées par e-mail / boîte app) */
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

  let body: { token?: unknown; inviteId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const inviteIdRaw = typeof body.inviteId === "string" ? body.inviteId.trim() : "";

  if ((token && inviteIdRaw) || (!token && !inviteIdRaw)) {
    return NextResponse.json({ error: "Fournissez soit token soit inviteId" }, { status: 400 });
  }

  const now = new Date();

  if (inviteIdRaw) {
    if (!UUID_RE.test(inviteIdRaw)) {
      return NextResponse.json({ error: "inviteId invalide" }, { status: 400 });
    }

    const invite = await prisma.studioClientInvite.findUnique({
      where: { id: inviteIdRaw },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }

    if (!invite.inviteeEmail) {
      return NextResponse.json(
        {
          error:
            "Cette invitation ne cible pas une adresse e-mail précise : ouvrez le lien reçu pour l’accepter.",
        },
        { status: 403 },
      );
    }

    const result = await acceptStudioInviteForSessionUser(invite, userId, now);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, message: result.message });
  }

  if (!isValidInviteTokenShape(token)) {
    return NextResponse.json({ error: "Jeton invalide" }, { status: 400 });
  }

  const tokenHash = hashInviteToken(token);
  const invite = await prisma.studioClientInvite.findUnique({
    where: { tokenHash },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  const result = await acceptStudioInviteForSessionUser(invite, userId, now);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, message: result.message });
}
