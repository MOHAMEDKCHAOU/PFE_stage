import { prisma } from "@/lib/prisma";
import { getPublicBadgePayloadForUser } from "@/lib/faymoos-badges";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/badges/public?identitySlug= — score + badges (aperçu + liste complète) */
export async function GET(req: Request) {
  try {
    const slug = new URL(req.url).searchParams.get("identitySlug")?.trim();
    if (!slug) {
      return NextResponse.json({ error: "identitySlug requis" }, { status: 400 });
    }

    const identity = await prisma.identityProfile.findUnique({
      where: { slug },
      select: { userId: true },
    });
    if (!identity) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    const payload = await getPublicBadgePayloadForUser(identity.userId);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("GET /api/badges/public", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
