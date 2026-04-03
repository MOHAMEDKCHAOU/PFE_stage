import { prisma } from "@/lib/prisma";
import { requireAffiliateur } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET — Statistiques globales des clients de l'affiliateur
export async function GET() {
  try {
    const userId = await requireAffiliateur();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Compter les clients
    const totalClients = await prisma.user.count({
      where: { affiliatorId: userId },
    });

    // IDs des clients
    const clientIds = await prisma.user.findMany({
      where: { affiliatorId: userId },
      select: { id: true },
    });
    const ids = clientIds.map((c) => c.id);

    // Identités des clients
    const identities = await prisma.identityProfile.findMany({
      where: { userId: { in: ids } },
      select: { id: true },
    });
    const identityIds = identities.map((i) => i.id);

    // Capsules totales
    const totalCapsules = await prisma.capsule.count({
      where: { identityId: { in: identityIds } },
    });

    // Sessions totales (analytics)
    const totalSessions = await prisma.capsuleSession.count({
      where: {
        capsule: { identityId: { in: identityIds } },
      },
    });

    // Événements CTA_CLICK
    const totalCtaClicks = await prisma.capsuleEvent.count({
      where: {
        type: "CTA_CLICK",
        session: {
          capsule: { identityId: { in: identityIds } },
        },
      },
    });

    // Messages reçus
    const totalMessages = await prisma.message.count({
      where: { identityId: { in: identityIds } },
    });

    // Clients récents (5 derniers)
    const recentClients = await prisma.user.findMany({
      where: { affiliatorId: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        identityProfiles: {
          select: { name: true, avatar: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      totalClients,
      totalCapsules,
      totalSessions,
      totalCtaClicks,
      totalMessages,
      recentClients,
    });
  } catch (error) {
    console.error("GET AFFILIATEUR STATS ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
