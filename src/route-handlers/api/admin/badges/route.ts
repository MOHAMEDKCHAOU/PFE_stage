import { requirePermission } from "@/lib/auth";
import { ensureBadgeDefinitions } from "@/lib/faymoos-badges";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/admin/badges — catalogue + répartition */
export async function GET() {
  try {
    const auth = await requirePermission("admin:badges:manage");
    if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    await ensureBadgeDefinitions();

    const [definitions, grouped, totalAssignments] = await Promise.all([
      prisma.badgeDefinition.findMany({
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.userBadge.groupBy({
        by: ["badgeId"],
        _count: { _all: true },
      }),
      prisma.userBadge.count(),
    ]);

    const countByBadge = Object.fromEntries(grouped.map((g) => [g.badgeId, g._count._all]));

    return NextResponse.json({
      definitions: definitions.map((d) => ({
        id: d.id,
        slug: d.slug,
        label: d.label,
        description: d.description,
        category: d.category,
        sortOrder: d.sortOrder,
        assignedCount: countByBadge[d.id] ?? 0,
      })),
      totalAssignments,
    });
  } catch (e) {
    console.error("GET /api/admin/badges", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
