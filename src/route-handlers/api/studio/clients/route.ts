import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac-policy";
import { requireAffiliate } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { normalizeStudioClientEmail } from "@/lib/studio-client-email";
import { requireStudioSubscriptionOrResponse } from "@/lib/studio-plan-guard";
import { assertCanAddStudioClient } from "@/lib/subscription-guards";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Max. liaisons par affilié / fenêtre (anti-abus & énumération d’emails). */
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

/** POST /api/studio/clients — lier un client par email (compte existant). */
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

  const linkQuota = await assertCanAddStudioClient(affiliateId);
  if (linkQuota) {
    return NextResponse.json({ error: linkQuota.error }, { status: linkQuota.status });
  }

  const normalized = typeof body.email === "string" ? normalizeStudioClientEmail(body.email) : null;
  if (!normalized) {
    return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  }

  const limited = checkRateLimit(`studio-client-link:${affiliateId}`, POST_LINK_LIMIT, POST_LINK_WINDOW_MS);
  if (!limited.ok) {
    const sec = Math.ceil(limited.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Trop de tentatives de liaison. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(sec) } },
    );
  }

  const client = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true, email: true, role: true },
  });

  if (!client) {
    return NextResponse.json(
      {
        error:
          "Liaison impossible : vérifiez l’adresse ou assurez-vous que le titulaire a bien créé un compte Faymoos.",
      },
      { status: 400 },
    );
  }

  if (client.id === affiliateId) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous ajouter comme client" }, { status: 400 });
  }

  if (hasPermission(client.role, "admin:stats:read")) {
    return NextResponse.json(
      { error: "Les comptes administrateur ne peuvent pas être rattachés comme clients." },
      { status: 403 },
    );
  }

  try {
    const link = await prisma.affiliateClient.create({
      data: { affiliateUserId: affiliateId, clientUserId: client.id },
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
    });
    return NextResponse.json(link, { status: 201 });
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "Ce client est déjà lié à votre espace commercial." }, { status: 409 });
    }
    console.error("POST STUDIO CLIENTS", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
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
