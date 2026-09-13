import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac-policy";
import { getUserId } from "@/lib/auth";
import { normalizeStudioClientEmail } from "@/lib/studio-client-email";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET — invitations Studio en attente pour l’e-mail du compte connecté (acceptation dans l’app) */
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  if (hasPermission(user.role, "admin:stats:read")) {
    return NextResponse.json([]);
  }

  const normalized = normalizeStudioClientEmail(user.email);
  if (!normalized) {
    return NextResponse.json([]);
  }

  const now = new Date();
  const rows = await prisma.studioClientInvite.findMany({
    where: {
      inviteeEmail: normalized,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
      NOT: { affiliateUserId: userId },
    },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
      affiliate: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(rows);
}
