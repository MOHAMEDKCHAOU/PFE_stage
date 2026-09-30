import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Côté CLIENT : partenaires Studio (affiliés) ayant accès au compte connecté.
 * Aucune permission Studio requise — tout utilisateur peut être client d’un partenaire
 * et doit pouvoir consulter puis retirer ce consentement à tout moment.
 */

/** GET /api/studio/partners — partenaires ayant accès à mon compte */
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const links = await prisma.affiliateClient.findMany({
    where: { clientUserId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      affiliate: { select: { id: true, email: true } },
    },
  });

  return NextResponse.json(
    links.map((link) => ({
      affiliateUserId: link.affiliate.id,
      affiliateEmail: link.affiliate.email,
      linkedAt: link.createdAt.toISOString(),
    })),
  );
}

/** DELETE /api/studio/partners?affiliateUserId= — retirer l’accès d’un partenaire à mon compte */
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const affiliateUserId = new URL(req.url).searchParams.get("affiliateUserId")?.trim();
  if (!affiliateUserId) {
    return NextResponse.json({ error: "affiliateUserId requis" }, { status: 400 });
  }

  // Filtré sur clientUserId = utilisateur connecté : impossible de retirer le lien d’un autre compte.
  const result = await prisma.affiliateClient.deleteMany({
    where: { clientUserId: userId, affiliateUserId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Aucun accès partenaire à retirer" }, { status: 404 });
  }

  await writeAuditLog({
    actorUserId: userId,
    action: "STUDIO_CLIENT_UNLINKED_BY_CLIENT",
    targetType: "AffiliateClient",
    targetId: affiliateUserId,
    metadata: { affiliateUserId, clientUserId: userId },
  });

  const client = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  await prisma.notification
    .create({
      data: {
        userId: affiliateUserId,
        type: "STUDIO_ACCESS_REVOKED",
        title: "Accès client retiré",
        body: `${client?.email ?? "Un client"} a retiré votre accès à son espace Faymoos.`,
        link: "/dashboard/studio",
      },
    })
    .catch(() => undefined);

  return NextResponse.json({ success: true });
}
