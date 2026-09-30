import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireAffiliate } from "@/lib/auth";
import { requireStudioSubscriptionOrResponse } from "@/lib/studio-plan-guard";
import {
  AGENCY_NAME_MAX,
  formatPartnerCode,
  getOrCreatePartnerProfile,
  isSafeLogoUrl,
  partnerJoinPath,
  rotatePartnerCode,
} from "@/lib/studio-partner-code";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ error: "Accès réservé aux partenaires affiliés (espace commercial)." }, { status: 403 });
}

/** Erreur lisible côté UI au lieu d’une page 500 HTML (ex. migration non appliquée, client Prisma périmé). */
function serverError(scope: string, e: unknown) {
  const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
  console.error(`STUDIO PARTNER CODE ${scope}`, e);
  if (code === "P2021" || code === "P2022" || e instanceof TypeError) {
    return NextResponse.json(
      {
        error:
          "QR code indisponible : base de données non à jour. Lancez `npx prisma migrate deploy` puis `npx prisma generate`, et redémarrez le serveur.",
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: "Erreur serveur lors du chargement du QR code." }, { status: 500 });
}

type PartnerProfileRow = Awaited<ReturnType<typeof getOrCreatePartnerProfile>>;

function serialize(profile: PartnerProfileRow, pendingRequests: number) {
  return {
    code: formatPartnerCode(profile.code),
    joinPath: partnerJoinPath(profile.code),
    active: profile.active,
    agencyName: profile.agencyName,
    logoUrl: profile.logoUrl,
    joinsCount: profile.joinsCount,
    rotatedAt: profile.rotatedAt?.toISOString() ?? null,
    pendingRequests,
  };
}

async function pendingCount(affiliateUserId: string) {
  return prisma.studioJoinRequest.count({ where: { affiliateUserId, status: "PENDING" } });
}

/** GET /api/studio/partner-code — code partenaire (QR) de l’affilié, créé au premier accès. */
export async function GET() {
  const affiliateId = await requireAffiliate();
  const denied = await requireStudioSubscriptionOrResponse(affiliateId);
  if (denied) return denied;
  if (!affiliateId) return forbidden();

  try {
    const profile = await getOrCreatePartnerProfile(affiliateId);
    return NextResponse.json(serialize(profile, await pendingCount(affiliateId)));
  } catch (e) {
    return serverError("GET", e);
  }
}

/**
 * PATCH /api/studio/partner-code
 * { action?: "rotate" | "enable" | "disable", agencyName?: string | null, logoUrl?: string | null }
 */
export async function PATCH(req: Request) {
  const affiliateId = await requireAffiliate();
  const denied = await requireStudioSubscriptionOrResponse(affiliateId);
  if (denied) return denied;
  if (!affiliateId) return forbidden();

  let body: { action?: unknown; agencyName?: unknown; logoUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const data: { active?: boolean; agencyName?: string | null; logoUrl?: string | null } = {};

  if (body.action !== undefined && !["rotate", "enable", "disable"].includes(String(body.action))) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }
  if (body.action === "enable") data.active = true;
  if (body.action === "disable") data.active = false;

  if (body.agencyName !== undefined) {
    if (body.agencyName !== null && typeof body.agencyName !== "string") {
      return NextResponse.json({ error: "Nom d’agence invalide" }, { status: 400 });
    }
    const name = typeof body.agencyName === "string" ? body.agencyName.trim() : "";
    if (name.length > AGENCY_NAME_MAX) {
      return NextResponse.json({ error: `Nom d’agence trop long (max ${AGENCY_NAME_MAX} caractères)` }, { status: 400 });
    }
    data.agencyName = name || null;
  }

  if (body.logoUrl !== undefined) {
    if (body.logoUrl !== null && (typeof body.logoUrl !== "string" || !isSafeLogoUrl(body.logoUrl))) {
      return NextResponse.json({ error: "Logo invalide : utilisez un fichier importé sur Faymoos" }, { status: 400 });
    }
    data.logoUrl = body.logoUrl;
  }

  try {
    await getOrCreatePartnerProfile(affiliateId);

    let profile = Object.keys(data).length
      ? await prisma.studioPartnerProfile.update({ where: { affiliateUserId: affiliateId }, data })
      : await getOrCreatePartnerProfile(affiliateId);

    if (body.action === "rotate") {
      profile = await rotatePartnerCode(affiliateId);
      await writeAuditLog({
        actorUserId: affiliateId,
        action: "STUDIO_PARTNER_CODE_ROTATED",
        targetType: "StudioPartnerProfile",
        targetId: profile.id,
      });
    }

    return NextResponse.json(serialize(profile, await pendingCount(affiliateId)));
  } catch (e) {
    return serverError("PATCH", e);
  }
}
