import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireAffiliate } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { normalizeStudioClientEmail } from "@/lib/studio-client-email";
import { generateInviteToken } from "@/lib/studio-invite-token";
import { requireStudioSubscriptionOrResponse } from "@/lib/studio-plan-guard";
import { assertCanAddStudioClient, assertCanCreateStudioInvite } from "@/lib/subscription-guards";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Durée de validité d’une demande d’accès envoyée par e-mail. */
const ACCESS_REQUEST_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;

/** Max. demandes d’accès par affilié / fenêtre (anti-abus & énumération d’emails). */
const POST_LINK_LIMIT = 25;
const POST_LINK_WINDOW_MS = 60 * 60 * 1000;
const DELETE_LINK_LIMIT = 40;
const DELETE_LINK_WINDOW_MS = 60 * 60 * 1000;

/** GET /api/studio/clients — clients liés au Studio (rôle AFFILIATE). */
export async function GET() {
  const affiliateId = await requireAffiliate();
  const denied = await requireStudioSubscriptionOrResponse(affiliateId);
  if (denied) return denied;
  if (!affiliateId) {
    return NextResponse.json({ error: "Accès réservé aux partenaires affiliés (espace commercial)." }, { status: 403 });
  }

  const links = await prisma.affiliateClient.findMany({
    where: { affiliateUserId: affiliateId },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          createdAt: true,
          _count: { select: { identityProfiles: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

/**
 * POST /api/studio/clients — demander l’accès au compte d’un client par e-mail.
 *
 * Ne crée JAMAIS la liaison directement : une invitation ciblée sur cet e-mail est
 * créée et le client doit l’accepter depuis sa boîte d’invitations (consentement
 * explicite du titulaire). La réponse est identique que le compte existe ou non,
 * afin de ne pas permettre l’énumération des e-mails inscrits.
 */
export async function POST(req: Request) {
  const affiliateId = await requireAffiliate();
  const denied = await requireStudioSubscriptionOrResponse(affiliateId);
  if (denied) return denied;
  if (!affiliateId) {
    return NextResponse.json({ error: "Accès réservé aux partenaires affiliés (espace commercial)." }, { status: 403 });
  }

  let body: { email?: unknown; confirmConsent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const consent = body.confirmConsent === true;
  if (!consent) {
    return NextResponse.json(
      { error: "Vous devez confirmer disposer d’un mandat ou d’un accord du client." },
      { status: 400 },
    );
  }

  const normalized = typeof body.email === "string" ? normalizeStudioClientEmail(body.email) : null;
  if (!normalized) {
    return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  }

  const limited = checkRateLimit(`studio-client-link:${affiliateId}`, POST_LINK_LIMIT, POST_LINK_WINDOW_MS);
  if (!limited.ok) {
    const sec = Math.ceil(limited.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Trop de demandes d’accès. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(sec) } },
    );
  }

  const affiliate = await prisma.user.findUnique({
    where: { id: affiliateId },
    select: { email: true },
  });
  if (affiliate && normalizeStudioClientEmail(affiliate.email) === normalized) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous ajouter comme client" }, { status: 400 });
  }

  const linkQuota = await assertCanAddStudioClient(affiliateId);
  if (linkQuota) {
    return NextResponse.json({ error: linkQuota.error }, { status: linkQuota.status });
  }

  const now = new Date();
  const alreadyPending = await prisma.studioClientInvite.findFirst({
    where: {
      affiliateUserId: affiliateId,
      inviteeEmail: normalized,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: { id: true, expiresAt: true },
  });

  let expiresAt = alreadyPending?.expiresAt ?? null;

  if (!alreadyPending) {
    const inviteQuota = await assertCanCreateStudioInvite(affiliateId);
    if (inviteQuota) {
      return NextResponse.json({ error: inviteQuota.error }, { status: inviteQuota.status });
    }

    expiresAt = new Date(now.getTime() + ACCESS_REQUEST_VALIDITY_MS);
    // Le jeton brut n’est pas renvoyé : cette invitation s’accepte uniquement depuis
    // la boîte d’invitations du compte portant cet e-mail.
    const { tokenHash } = generateInviteToken();
    try {
      const invite = await prisma.studioClientInvite.create({
        data: {
          tokenHash,
          affiliateUserId: affiliateId,
          inviteeEmail: normalized,
          expiresAt,
        },
        select: { id: true },
      });
      await writeAuditLog({
        actorUserId: affiliateId,
        action: "STUDIO_CLIENT_ACCESS_REQUESTED",
        targetType: "StudioClientInvite",
        targetId: invite.id,
        metadata: { inviteeEmail: normalized },
      });
    } catch (e) {
      console.error("POST STUDIO CLIENTS (access request)", e);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }

  return NextResponse.json(
    {
      success: true,
      status: "PENDING_CLIENT_APPROVAL",
      inviteeEmail: normalized,
      expiresAt,
      message:
        "Demande d’accès envoyée. Si un compte Faymoos utilise cette adresse, son titulaire devra l’accepter depuis son tableau de bord avant que vous puissiez gérer son espace.",
    },
    { status: 202 },
  );
}

/** DELETE /api/studio/clients?clientUserId= — retirer le lien. */
export async function DELETE(req: Request) {
  const affiliateId = await requireAffiliate();
  const denied = await requireStudioSubscriptionOrResponse(affiliateId);
  if (denied) return denied;
  if (!affiliateId) {
    return NextResponse.json({ error: "Accès réservé aux partenaires affiliés (espace commercial)." }, { status: 403 });
  }

  const clientUserId = new URL(req.url).searchParams.get("clientUserId");
  if (!clientUserId) {
    return NextResponse.json({ error: "clientUserId requis" }, { status: 400 });
  }

  const delLimited = checkRateLimit(
    `studio-client-unlink:${affiliateId}`,
    DELETE_LINK_LIMIT,
    DELETE_LINK_WINDOW_MS,
  );
  if (!delLimited.ok) {
    const sec = Math.ceil(delLimited.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Trop de suppressions de lien. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(sec) } },
    );
  }

  const result = await prisma.affiliateClient.deleteMany({
    where: { affiliateUserId: affiliateId, clientUserId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
