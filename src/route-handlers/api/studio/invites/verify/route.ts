import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { hashInviteToken, isValidInviteTokenShape } from "@/lib/studio-invite-token";
import { NextResponse } from "next/server";

const VERIFY_LIMIT = 80;
const VERIFY_WINDOW_MS = 60 * 1000;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "***";
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}***@${domain}`;
}

/** GET — métadonnées publiques d’une invitation (sans révéler l’existence précise autant que possible) */
export async function GET(req: Request) {
  const ip = clientIp(req);
  const vr = checkRateLimit(`studio-invite-verify:${ip}`, VERIFY_LIMIT, VERIFY_WINDOW_MS);
  if (!vr.ok) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const token = new URL(req.url).searchParams.get("token");
  if (!token || !isValidInviteTokenShape(token)) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  }

  const tokenHash = hashInviteToken(token);
  const invite = await prisma.studioClientInvite.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true,
      revokedAt: true,
      acceptedAt: true,
      inviteeEmail: true,
    },
  });

  const now = new Date();
  if (!invite) {
    return NextResponse.json({ error: "Invitation introuvable ou expirée" }, { status: 404 });
  }

  if (invite.revokedAt) {
    return NextResponse.json({ error: "Invitation refusée ou annulée" }, { status: 410 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Invitation déjà utilisée" }, { status: 410 });
  }

  if (invite.expiresAt <= now) {
    return NextResponse.json({ error: "Invitation expirée" }, { status: 410 });
  }

  return NextResponse.json({
    ok: true,
    expiresAt: invite.expiresAt.toISOString(),
    lockedToEmail: !!invite.inviteeEmail,
    maskedInviteeEmail: invite.inviteeEmail ? maskEmail(invite.inviteeEmail) : null,
  });
}
