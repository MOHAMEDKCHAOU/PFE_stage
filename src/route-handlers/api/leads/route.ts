import { getAuthContext, requirePermission } from "@/lib/auth";
import { clientIp, createPublicLead, LEAD_STATUSES, type LeadStatus } from "@/lib/leads";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { canManageIdentityAsOwner, getManagedUserIdsForViewer } from "@/lib/studio-access";
import type { Prisma } from "@/generated/prisma";
import { NextResponse } from "next/server";

const PAGE_SIZE = 50;
const CREATE_LIMIT = 8;
const CREATE_WINDOW_MS = 60 * 60 * 1000;

async function deny() {
  const auth = await getAuthContext();
  return NextResponse.json(
    { error: auth ? "Accès refusé" : "Connexion requise" },
    { status: auth ? 403 : 401 },
  );
}

function isStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

/** GET /api/leads?status=&q=&identityId=&cursor= — leads du compte + clients Studio gérés */
export async function GET(req: Request) {
  const auth = await requirePermission("leads:manage");
  if (!auth) return deny();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const identityId = searchParams.get("identityId");
  const cursor = searchParams.get("cursor");

  const ownerIds = await getManagedUserIdsForViewer(auth.userId);
  const scope: Prisma.LeadWhereInput = {
    userId: { in: ownerIds },
    ...(identityId ? { identityId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, grouped] = await Promise.all([
    prisma.lead.findMany({
      where: { ...scope, ...(isStatus(status) ? { status } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        identity: { select: { id: true, name: true, slug: true } },
        capsule: { select: { id: true, title: true } },
      },
    }),
    prisma.lead.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const leads = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const g of grouped) if (isStatus(g.status)) counts[g.status] = g._count._all;

  return NextResponse.json({ leads, counts, nextCursor: hasMore ? leads[leads.length - 1]!.id : null });
}

/**
 * POST /api/leads — public (formulaire CTA d’une capsule).
 * { identityId, capsuleId?, optionId?, name, email?, phone?, message?, website (piège anti-robot) }
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });

  // Champ invisible pour un humain : un robot qui le remplit reçoit un faux succès.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const limited = checkRateLimit(`lead-create:${clientIp(req)}`, CREATE_LIMIT, CREATE_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes envoyées. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) } },
    );
  }

  try {
    const result = await createPublicLead({
      identityId: body.identityId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
      capsuleId: body.capsuleId,
      optionId: body.optionId,
      source: "CTA_FORM",
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("POST /api/leads", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** PATCH /api/leads { id, status } — propriétaire ou partenaire Studio habilité */
export async function PATCH(req: Request) {
  const auth = await requirePermission("leads:manage");
  if (!auth) return deny();

  const body = (await req.json().catch(() => null)) as { id?: unknown; status?: unknown } | null;
  if (typeof body?.id !== "string" || !isStatus(body.status)) {
    return NextResponse.json({ error: "id et statut valide requis" }, { status: 400 });
  }

  const found = await prisma.lead.findUnique({ where: { id: body.id }, select: { id: true, userId: true } });
  if (!found || !(await canManageIdentityAsOwner(auth.userId, found.userId))) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  const lead = await prisma.lead.update({ where: { id: found.id }, data: { status: body.status } });
  return NextResponse.json({ lead });
}
