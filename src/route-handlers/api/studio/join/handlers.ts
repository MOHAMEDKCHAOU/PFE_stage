import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { hasPermission } from "@/lib/rbac-policy";
import { checkAffiliateCanTakeClient, checkClientCanBeLinked } from "@/lib/studio-link-guards";
import { formatPartnerCode, maskEmail, normalizePartnerCode } from "@/lib/studio-partner-code";
import { NextResponse } from "next/server";

const PREVIEW_LIMIT = 60;
const PREVIEW_WINDOW_MS = 60 * 1000;
const REQUEST_LIMIT = 20;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
/** Après un refus, le client ne peut pas relancer immédiatement le même partenaire. */
const DECLINE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const INVALID_CODE = "Code partenaire invalide ou désactivé.";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

/** Profil partenaire actif dont l’affilié est encore habilité ; null sinon (même réponse publique). */
async function findActivePartner(rawCode: string) {
  const code = normalizePartnerCode(rawCode);
  if (!code) return null;
  const profile = await prisma.studioPartnerProfile.findUnique({
    where: { code },
    select: {
      code: true,
      active: true,
      agencyName: true,
      logoUrl: true,
      affiliateUserId: true,
      affiliate: { select: { email: true, role: true, status: true } },
    },
  });
  if (
    !profile ||
    !profile.active ||
    profile.affiliate.status !== "ACTIVE" ||
    !hasPermission(profile.affiliate.role, "studio:access")
  ) {
    return null;
  }
  return profile;
}

/** GET — aperçu public de l’écran de consentement (aucun identifiant interne exposé). */
export async function getJoinPreview(req: Request, rawCode: string) {
  const limited = checkRateLimit(`studio-join-preview:${clientIp(req)}`, PREVIEW_LIMIT, PREVIEW_WINDOW_MS);
  if (!limited.ok) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const partner = await findActivePartner(rawCode);
  if (!partner) return NextResponse.json({ error: INVALID_CODE }, { status: 404 });

  const viewerId = await getUserId();
  let viewer: null | {
    isSelf: boolean;
    alreadyLinked: boolean;
    requestStatus: "PENDING" | "DECLINED" | null;
  } = null;

  if (viewerId) {
    const [link, lastRequest] = await Promise.all([
      prisma.affiliateClient.findUnique({
        where: {
          affiliateUserId_clientUserId: { affiliateUserId: partner.affiliateUserId, clientUserId: viewerId },
        },
        select: { id: true },
      }),
      prisma.studioJoinRequest.findFirst({
        where: { affiliateUserId: partner.affiliateUserId, clientUserId: viewerId },
        orderBy: { createdAt: "desc" },
        select: { status: true },
      }),
    ]);
    viewer = {
      isSelf: viewerId === partner.affiliateUserId,
      alreadyLinked: Boolean(link),
      requestStatus:
        lastRequest?.status === "PENDING" || lastRequest?.status === "DECLINED" ? lastRequest.status : null,
    };
  }

  return NextResponse.json({
    code: formatPartnerCode(partner.code),
    agencyName: partner.agencyName,
    logoUrl: partner.logoUrl,
    // Adresse complète seulement pour un visiteur connecté (écran de consentement anti-phishing).
    partnerEmail: viewerId ? partner.affiliate.email : maskEmail(partner.affiliate.email),
    viewer,
  });
}

/** POST — le client connecté demande son rattachement (l’affilié devra valider). */
export async function postJoinRequest(req: Request, rawCode: string) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const limited = checkRateLimit(`studio-join-request:${userId}`, REQUEST_LIMIT, REQUEST_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } },
    );
  }

  const partner = await findActivePartner(rawCode);
  if (!partner) return NextResponse.json({ error: INVALID_CODE }, { status: 404 });
  const affiliateUserId = partner.affiliateUserId;

  const clientCheck = await checkClientCanBeLinked(affiliateUserId, userId);
  if (!clientCheck.ok) return NextResponse.json({ error: clientCheck.error }, { status: clientCheck.status });
  const affiliateCheck = await checkAffiliateCanTakeClient(affiliateUserId);
  if (!affiliateCheck.ok) return NextResponse.json({ error: affiliateCheck.error }, { status: affiliateCheck.status });

  const last = await prisma.studioJoinRequest.findFirst({
    where: { affiliateUserId, clientUserId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, decidedAt: true },
  });
  if (last?.status === "PENDING") {
    return NextResponse.json({ success: true, status: "PENDING" });
  }
  if (last?.status === "DECLINED" && last.decidedAt && Date.now() - last.decidedAt.getTime() < DECLINE_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "Ce partenaire a refusé votre demande récemment. Réessayez dans 24 heures." },
      { status: 429 },
    );
  }

  const request = await prisma.studioJoinRequest.create({
    data: { affiliateUserId, clientUserId: userId, source: "QR" },
    select: { id: true },
  });

  await writeAuditLog({
    actorUserId: userId,
    action: "STUDIO_JOIN_REQUESTED",
    targetType: "StudioJoinRequest",
    targetId: request.id,
    metadata: { affiliateUserId, via: "QR" },
  });

  const client = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  await prisma.notification
    .create({
      data: {
        userId: affiliateUserId,
        type: "STUDIO_JOIN_REQUEST",
        title: "Nouvelle demande de rattachement",
        body: `${client?.email ?? "Un utilisateur"} a scanné votre QR code et demande à rejoindre votre espace.`,
        link: "/dashboard/studio",
      },
    })
    .catch(() => undefined);

  return NextResponse.json({ success: true, status: "PENDING" }, { status: 201 });
}

/** DELETE — le client annule sa demande en attente. */
export async function cancelJoinRequest(_req: Request, rawCode: string) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const code = normalizePartnerCode(rawCode);
  const profile = code
    ? await prisma.studioPartnerProfile.findUnique({ where: { code }, select: { affiliateUserId: true } })
    : null;
  if (!profile) return NextResponse.json({ error: INVALID_CODE }, { status: 404 });

  const res = await prisma.studioJoinRequest.updateMany({
    where: { affiliateUserId: profile.affiliateUserId, clientUserId: userId, status: "PENDING" },
    data: { status: "CANCELLED", decidedAt: new Date() },
  });
  if (res.count === 0) return NextResponse.json({ error: "Aucune demande en attente" }, { status: 404 });

  return NextResponse.json({ success: true, status: "CANCELLED" });
}
