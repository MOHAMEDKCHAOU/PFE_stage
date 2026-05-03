import { requireAdmin } from "@/lib/auth";
import { ensureBadgeDefinitions } from "@/lib/faymoos-badges";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** POST /api/admin/badges/grant { userId | email, badgeSlug, tier?: VERIFIED|EXPERT } */
export async function POST(req: Request) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const body = await req.json();
    const badgeSlug = typeof body.badgeSlug === "string" ? body.badgeSlug.trim() : "";
    const tier = body.tier === "EXPERT" ? "EXPERT" : "VERIFIED";
    let targetUserId = typeof body.userId === "string" ? body.userId.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!badgeSlug) {
      return NextResponse.json({ error: "badgeSlug requis" }, { status: 400 });
    }

    if (!targetUserId && email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!u) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      targetUserId = u.id;
    }
    if (!targetUserId) {
      return NextResponse.json({ error: "userId ou email requis" }, { status: 400 });
    }

    await ensureBadgeDefinitions();
    const def = await prisma.badgeDefinition.findUnique({ where: { slug: badgeSlug } });
    if (!def) {
      return NextResponse.json({ error: "Badge inconnu" }, { status: 404 });
    }

    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: targetUserId, badgeId: def.id } },
      create: {
        userId: targetUserId,
        badgeId: def.id,
        tier,
        source: "ADMIN",
        evidence: "Attribué depuis l’administration Faymoos",
        verifiedAt: new Date(),
      },
      update: {
        tier,
        source: "ADMIN",
        evidence: "Attribué depuis l’administration Faymoos",
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/admin/badges/grant", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
