import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { canManageIdentityAsOwner } from "@/lib/studio-access";
import { NextResponse } from "next/server";

// GET /api/analytics?identityId=xxx OR ?capsuleId=xxx (Protected)
// Returns full analytics stats for capsules
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const identityId = searchParams.get("identityId");
    const capsuleId = searchParams.get("capsuleId");

    if (!identityId && !capsuleId) {
      return NextResponse.json(
        { error: "identityId ou capsuleId requis" },
        { status: 400 }
      );
    }

    // Single capsule mode
    if (capsuleId) {
      const capsule = await prisma.capsule.findUnique({
        where: { id: capsuleId },
        include: {
          identity: true,
          options: { include: { branch: true } },
          sessions: {
            include: { events: { orderBy: { createdAt: "asc" } } },
          },
        },
      });
      if (!capsule || !(await canManageIdentityAsOwner(userId, capsule.identity.userId))) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
      return NextResponse.json([buildCapsuleAnalytics(capsule)]);
    }

    // All capsules for identity
    const identity = await prisma.identityProfile.findUnique({
      where: { id: identityId! },
    });
    if (!identity || !(await canManageIdentityAsOwner(userId, identity.userId))) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    // Get all capsules with sessions and events
    const capsules = await prisma.capsule.findMany({
      where: { identityId: identityId! },
      include: {
        options: {
          include: { branch: true },
        },
        sessions: {
          include: {
            events: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    const analytics = capsules.map(buildCapsuleAnalytics);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("GET ANALYTICS ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCapsuleAnalytics(capsule: any) {
  const sessions = capsule.sessions;
  const totalSessions = sessions.length;

  const completedSessions = sessions.filter(
    (s: any) => s.endedAt !== null
  );
  const completionRate =
    totalSessions > 0
      ? Math.round((completedSessions.length / totalSessions) * 100)
      : 0;

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const abandonedSessions = sessions.filter(
    (s: any) => !s.endedAt && s.startedAt < fiveMinAgo
  );
  const abandonRate =
    totalSessions > 0
      ? Math.round((abandonedSessions.length / totalSessions) * 100)
      : 0;

  const decisionTimes: number[] = [];
  for (const session of sessions) {
    const startEvent = (session as any).events.find(
      (e: any) => e.type === "START"
    );
    const firstClick = (session as any).events.find(
      (e: any) => e.type === "OPTION_CLICK"
    );
    if (startEvent && firstClick) {
      const diff =
        new Date(firstClick.createdAt).getTime() -
        new Date(startEvent.createdAt).getTime();
      if (diff > 0 && diff < 300000) {
        decisionTimes.push(diff);
      }
    }
  }
  const avgDecisionTime =
    decisionTimes.length > 0
      ? Math.round(
          decisionTimes.reduce((a, b) => a + b, 0) /
            decisionTimes.length /
            1000
        )
      : 0;

  const optionClicks: Record<string, number> = {};
  const ctaClicks: Record<string, number> = {};
  for (const session of sessions) {
    for (const event of (session as any).events) {
      if (event.type === "OPTION_CLICK" && event.value) {
        optionClicks[event.value] = (optionClicks[event.value] || 0) + 1;
      }
      if (event.type === "CTA_CLICK" && event.value) {
        ctaClicks[event.value] = (ctaClicks[event.value] || 0) + 1;
      }
    }
  }

  const allEvents = sessions.flatMap((s: any) => s.events);
  const totalOptionClicks = allEvents.filter(
    (e: any) => e.type === "OPTION_CLICK"
  ).length;
  const totalCtaClicks = allEvents.filter(
    (e: any) => e.type === "CTA_CLICK"
  ).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSessions = sessions.filter(
    (s: any) => s.startedAt >= thirtyDaysAgo
  );
  const sessionsByDay: Record<string, number> = {};
  for (const s of recentSessions) {
    const day = new Date((s as any).startedAt).toISOString().split("T")[0];
    sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
  }

  return {
    capsuleId: capsule.id,
    capsuleTitle: capsule.title,
    capsuleObjective: capsule.objective,
    optionsCount: capsule.options.length,
    stats: {
      totalSessions,
      completedSessions: completedSessions.length,
      completionRate,
      abandonedSessions: abandonedSessions.length,
      abandonRate,
      avgDecisionTime,
      totalOptionClicks,
      totalCtaClicks,
    },
    branchPerformance: Object.entries(optionClicks)
      .map(([label, clicks]) => ({
        label,
        clicks,
        ctaClicks: ctaClicks[label] || 0,
      }))
      .sort((a, b) => b.clicks - a.clicks),
    sessionsByDay,
  };
}
