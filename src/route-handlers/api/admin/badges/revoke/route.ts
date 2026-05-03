import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** DELETE /api/admin/badges/revoke { userId, badgeSlug } — retire le badge (toute source) */
export async function DELETE(req: Request) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const body = await req.json();
    const badgeSlug = typeof body.badgeSlug === "string" ? body.badgeSlug.trim() : "";
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

    const def = await prisma.badgeDefinition.findUnique({ where: { slug: badgeSlug } });
    if (!def) return NextResponse.json({ error: "Badge inconnu" }, { status: 404 });

    const res = await prisma.userBadge.deleteMany({
      where: { userId: targetUserId, badgeId: def.id },
    });

    return NextResponse.json({ ok: true, deleted: res.count });
  } catch (e) {
    console.error("DELETE /api/admin/badges/revoke", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
