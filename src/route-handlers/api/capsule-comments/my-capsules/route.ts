import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getManagedUserIdsForViewer } from "@/lib/studio-access";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — capsules gérées (propriétaire + Studio) pour sélecteur modération */
export async function GET() {
  try {
    const auth = await requirePermission("comments:moderate");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const ownerIds = await getManagedUserIdsForViewer(userId);
    const capsules = await prisma.capsule.findMany({
      where: { identity: { userId: { in: ownerIds } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        commentsEnabled: true,
        identity: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({
      items: capsules.map((c) => ({
        id: c.id,
        title: c.title,
        commentsEnabled: c.commentsEnabled,
        identityName: c.identity.name,
        identitySlug: c.identity.slug,
      })),
    });
  } catch (e) {
    console.error("GET capsule-comments/my-capsules", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
