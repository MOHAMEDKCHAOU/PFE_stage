import { requirePermission } from "@/lib/auth";
import { computeFaymoosScore, syncAutoBadgesForUser } from "@/lib/faymoos-badges";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/admin/badges/user?email=&userId=&refreshAuto=1 */
export async function GET(req: Request) {
  try {
    const auth = await requirePermission("admin:badges:manage");
    if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
    const userIdParam = searchParams.get("userId")?.trim() ?? "";
    const refreshAuto = searchParams.get("refreshAuto") === "1";

    let userId = userIdParam;
    if (!userId && email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true, createdAt: true } });
      if (!u) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      userId = u.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "email ou userId requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    if (refreshAuto) {
      await syncAutoBadgesForUser(user.id);
    }

    const [badgesRows, scorePayload, identities] = await Promise.all([
      prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true },
        orderBy: { verifiedAt: "desc" },
      }),
      computeFaymoosScore(user.id),
      prisma.identityProfile.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return NextResponse.json({
      user,
      identities,
      score: scorePayload.score,
      scoreLabel: scorePayload.label,
      breakdown: scorePayload.breakdown,
      badges: badgesRows.map((ub) => ({
        id: ub.id,
        slug: ub.badge.slug,
        label: ub.badge.label,
        category: ub.badge.category,
        tier: ub.tier,
        source: ub.source,
        evidence: ub.evidence,
        verifiedAt: ub.verifiedAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("GET /api/admin/badges/user", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
