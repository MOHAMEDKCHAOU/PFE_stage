import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireAffiliate } from "@/lib/auth";
import { checkAffiliateCanTakeClient, checkClientCanBeLinked } from "@/lib/studio-link-guards";
import { requireStudioSubscriptionOrResponse } from "@/lib/studio-plan-guard";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

class RequestNoLongerPendingError extends Error {}

function forbidden() {
  return NextResponse.json({ error: "Accès réservé aux partenaires affiliés (espace commercial)." }, { status: 403 });
}

/** GET /api/studio/join-requests — demandes reçues via le QR partenaire (en attente + 20 dernières décisions). */
export async function GET() {
  const affiliateId = await requireAffiliate();
  const denied = await requireStudioSubscriptionOrResponse(affiliateId);
  if (denied) return denied;
  if (!affiliateId) return forbidden();

  const select = {
    id: true,
    status: true,
    source: true,
    createdAt: true,
    decidedAt: true,
    client: { select: { email: true, _count: { select: { identityProfiles: true } } } },
  } as const;

  const [pending, recent] = await Promise.all([
    prisma.studioJoinRequest.findMany({
      where: { affiliateUserId: affiliateId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select,
    }),
    prisma.studioJoinRequest.findMany({
      where: { affiliateUserId: affiliateId, status: { not: "PENDING" } },
      orderBy: { decidedAt: "desc" },
      take: 20,
      select,
    }),
  ]);

  return NextResponse.json({ pending, recent });
}

/** PATCH /api/studio/join-requests { id, decision: "approve" | "decline" } */
export async function PATCH(req: Request) {
  const affiliateId = await requireAffiliate();
  const denied = await requireStudioSubscriptionOrResponse(affiliateId);
  if (denied) return denied;
  if (!affiliateId) return forbidden();

  let body: { id?: unknown; decision?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const decision = body.decision === "approve" || body.decision === "decline" ? body.decision : null;
  if (!id || !decision) {
    return NextResponse.json({ error: "id et decision (approve|decline) requis" }, { status: 400 });
  }

  // Filtré sur l’affilié connecté : impossible de décider pour la demande d’un autre partenaire.
  const request = await prisma.studioJoinRequest.findFirst({
    where: { id, affiliateUserId: affiliateId },
    select: { id: true, status: true, clientUserId: true, client: { select: { email: true } } },
  });
  if (!request) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Cette demande a déjà été traitée ou annulée." }, { status: 409 });
  }

  const now = new Date();

  if (decision === "decline") {
    const res = await prisma.studioJoinRequest.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "DECLINED", decidedAt: now },
    });
    if (res.count !== 1) {
      return NextResponse.json({ error: "Cette demande a déjà été traitée ou annulée." }, { status: 409 });
    }
    await afterDecision(affiliateId, request.id, request.clientUserId, "DECLINED");
    return NextResponse.json({ success: true, status: "DECLINED" });
  }

  const affiliateCheck = await checkAffiliateCanTakeClient(affiliateId);
  if (!affiliateCheck.ok) {
    return NextResponse.json({ error: affiliateCheck.error }, { status: affiliateCheck.status });
  }
  const clientCheck = await checkClientCanBeLinked(affiliateId, request.clientUserId);
  if (!clientCheck.ok) {
    return NextResponse.json({ error: clientCheck.error }, { status: clientCheck.status });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Consommation atomique : une demande ne peut être validée qu’une seule fois.
      const claimed = await tx.studioJoinRequest.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", decidedAt: now },
      });
      if (claimed.count !== 1) throw new RequestNoLongerPendingError();

      await tx.affiliateClient.create({
        data: { affiliateUserId: affiliateId, clientUserId: request.clientUserId },
      });
      // Doublons éventuels du même client : sans objet une fois le lien créé.
      await tx.studioJoinRequest.updateMany({
        where: { affiliateUserId: affiliateId, clientUserId: request.clientUserId, status: "PENDING" },
        data: { status: "CANCELLED", decidedAt: now },
      });
      await tx.studioPartnerProfile.updateMany({
        where: { affiliateUserId: affiliateId },
        data: { joinsCount: { increment: 1 } },
      });
    });
  } catch (e: unknown) {
    if (e instanceof RequestNoLongerPendingError) {
      return NextResponse.json({ error: "Cette demande a déjà été traitée ou annulée." }, { status: 409 });
    }
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "Ce compte est déjà rattaché à votre espace." }, { status: 409 });
    }
    console.error("PATCH studio/join-requests", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  await writeAuditLog({
    actorUserId: affiliateId,
    action: "STUDIO_CLIENT_LINKED",
    targetType: "AffiliateClient",
    targetId: request.clientUserId,
    metadata: { via: "QR", joinRequestId: request.id, affiliateUserId: affiliateId, clientUserId: request.clientUserId },
  });
  await afterDecision(affiliateId, request.id, request.clientUserId, "APPROVED");

  return NextResponse.json({ success: true, status: "APPROVED" });
}

async function afterDecision(
  affiliateId: string,
  requestId: string,
  clientUserId: string,
  status: "APPROVED" | "DECLINED",
) {
  await writeAuditLog({
    actorUserId: affiliateId,
    action: "STUDIO_JOIN_DECIDED",
    targetType: "StudioJoinRequest",
    targetId: requestId,
    metadata: { status, clientUserId },
  });

  const profile = await prisma.studioPartnerProfile.findUnique({
    where: { affiliateUserId: affiliateId },
    select: { agencyName: true, affiliate: { select: { email: true } } },
  });
  const partner = profile?.agencyName || profile?.affiliate.email || "Le partenaire";
  const approved = status === "APPROVED";

  await prisma.notification
    .create({
      data: {
        userId: clientUserId,
        type: approved ? "STUDIO_JOIN_APPROVED" : "STUDIO_JOIN_DECLINED",
        title: approved ? "Rattachement validé" : "Demande de rattachement refusée",
        body: approved
          ? `${partner} peut désormais gérer votre espace Faymoos. Vous pouvez retirer cet accès à tout moment.`
          : `${partner} n’a pas donné suite à votre demande de rattachement.`,
        link: approved ? "/dashboard/settings/security" : "/dashboard",
      },
    })
    .catch(() => undefined);
}
