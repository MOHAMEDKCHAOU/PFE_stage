import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/analytics?identityId=xxx (Protected)
// Returns full analytics stats for all capsules of an identity
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const identityId = searchParams.get("identityId");

    if (!identityId) {
      return NextResponse.json(
        { error: "identityId requis" },
        { status: 400 }
      );
    }

    // Verify ownership
    const identity = await prisma.identityProfile.findUnique({
      where: { id: identityId },
    });
    if (!identity || identity.userId !== userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    // Get all capsules with sessions and events
    const capsules = await prisma.capsule.findMany({
      where: { identityId },
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

    // Build analytics per capsule
    const analytics = capsules.map((capsule) => {
      const sessions = capsule.sessions;
      const totalSessions = sessions.length;

      // Completed = sessions with endedAt
      const completedSessions = sessions.filter((s) => s.endedAt !== null);
      const completionRate =
        totalSessions > 0
          ? Math.round((completedSessions.length / totalSessions) * 100)
          : 0;

      // Abandonment = sessions without endedAt (and older than 5 min)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const abandonedSessions = sessions.filter(
        (s) => !s.endedAt && s.startedAt < fiveMinAgo
      );
      const abandonRate =
        totalSessions > 0
          ? Math.round((abandonedSessions.length / totalSessions) * 100)
          : 0;

      // Average decision time (time between START and first OPTION_CLICK)
      const decisionTimes: number[] = [];
      for (const session of sessions) {
        const startEvent = session.events.find((e) => e.type === "START");
        const firstClick = session.events.find(
          (e) => e.type === "OPTION_CLICK"
        );
        if (startEvent && firstClick) {
          const diff =
            new Date(firstClick.createdAt).getTime() -
            new Date(startEvent.createdAt).getTime();
          if (diff > 0 && diff < 300000) {
            // max 5 min
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

      // Branch/option performance
      const optionClicks: Record<string, number> = {};
      const ctaClicks: Record<string, number> = {};
      for (const session of sessions) {
        for (const event of session.events) {
          if (event.type === "OPTION_CLICK" && event.value) {
            optionClicks[event.value] = (optionClicks[event.value] || 0) + 1;
          }
          if (event.type === "CTA_CLICK" && event.value) {
            ctaClicks[event.value] = (ctaClicks[event.value] || 0) + 1;
          }
        }
      }

      // Total events by type
      const allEvents = sessions.flatMap((s) => s.events);
      const totalOptionClicks = allEvents.filter(
        (e) => e.type === "OPTION_CLICK"
      ).length;
      const totalCtaClicks = allEvents.filter(
        (e) => e.type === "CTA_CLICK"
      ).length;

      // Sessions over time (last 30 days, grouped by day)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSessions = sessions.filter(
        (s) => s.startedAt >= thirtyDaysAgo
      );
      const sessionsByDay: Record<string, number> = {};
      for (const s of recentSessions) {
        const day = new Date(s.startedAt).toISOString().split("T")[0];
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
          avgDecisionTime, // in seconds
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
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("GET ANALYTICS ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
