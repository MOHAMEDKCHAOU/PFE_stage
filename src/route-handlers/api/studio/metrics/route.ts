import { prisma } from "@/lib/prisma";
import { requireAffiliate } from "@/lib/auth";
import { requireStudioSubscriptionOrResponse } from "@/lib/studio-plan-guard";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** GET — indicateurs pilotage affilié (clients actifs, invitations, taux 30 j.) */
export async function GET() {
  const affiliateId = await requireAffiliate();
  const denied = await requireStudioSubscriptionOrResponse(affiliateId);
  if (denied) return denied;
  if (!affiliateId) {
    return NextResponse.json({ error: "Accès réservé aux partenaires affiliés (espace commercial)." }, { status: 403 });
  }

  const now = new Date();
  const since = new Date(now.getTime() - WINDOW_MS);

  const [activeClients, pendingInvites, invitesLast30d] = await Promise.all([
    prisma.affiliateClient.count({
      where: { affiliateUserId: affiliateId },
    }),
    prisma.studioClientInvite.count({
      where: {
        affiliateUserId: affiliateId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    }),
    prisma.studioClientInvite.findMany({
      where: {
        affiliateUserId: affiliateId,
        createdAt: { gte: since },
      },
      select: { acceptedAt: true },
    }),
  ]);

  const invitesCreatedLast30Days = invitesLast30d.length;
  const invitesAcceptedLast30Days = invitesLast30d.filter((r) => r.acceptedAt != null).length;
  const acceptanceRateLast30Days =
    invitesCreatedLast30Days === 0
      ? null
      : Math.round((1000 * invitesAcceptedLast30Days) / invitesCreatedLast30Days) / 10;

  return NextResponse.json({
    activeClients,
    pendingInvites,
    invitesCreatedLast30Days,
    invitesAcceptedLast30Days,
    acceptanceRateLast30Days,
    windowDays: 30,
  });
}
