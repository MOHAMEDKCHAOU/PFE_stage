import { prisma } from "@/lib/prisma";
import { requireAffiliate } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { normalizeStudioClientEmail } from "@/lib/studio-client-email";
import { generateInviteToken } from "@/lib/studio-invite-token";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/** Prisma / Node APIs (crypto dans `studio-invite-token`) */
export const runtime = "nodejs";

const CREATE_INVITE_LIMIT = 40;
const CREATE_INVITE_WINDOW_MS = 60 * 60 * 1000;

function inviteOrigin(req: Request): string {
  try {
    const u = new URL(req.url);
    return u.origin;
  } catch {
    return "";
  }
}

/** GET — invitations récentes (affilié) */
export async function GET(req: Request) {
  const affiliateId = await requireAffiliate();
  if (!affiliateId) {
    return NextResponse.json({ error: "Réservé aux comptes Studio (affilié)" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const take = Math.min(50, Math.max(5, Number(searchParams.get("take")) || 25));

  const rows = await prisma.studioClientInvite.findMany({
    where: { affiliateUserId: affiliateId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      inviteeEmail: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  const now = new Date();
  const items = rows.map((r) => {
    let state: "pending" | "accepted" | "revoked" | "expired";
    if (r.acceptedAt) state = "accepted";
    else if (r.revokedAt) state = "revoked";
    else if (r.expiresAt <= now) state = "expired";
    else state = "pending";

    return {
      id: r.id,
      inviteeEmail: r.inviteeEmail,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      state,
    };
  });

  return NextResponse.json(items);
}

/** POST — créer une invitation (retourne le lien une seule fois) */
export async function POST(req: Request) {
  const affiliateId = await requireAffiliate();
  if (!affiliateId) {
    return NextResponse.json({ error: "Réservé aux comptes Studio (affilié)" }, { status: 403 });
  }

  let body: { inviteeEmail?: unknown; validityDays?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  let inviteeEmail: string | null = null;
  if (body.inviteeEmail != null && body.inviteeEmail !== "") {
    if (typeof body.inviteeEmail !== "string") {
      return NextResponse.json({ error: "inviteeEmail invalide" }, { status: 400 });
    }
    const n = normalizeStudioClientEmail(body.inviteeEmail);
    if (!n) return NextResponse.json({ error: "E-mail invité invalide" }, { status: 400 });
    inviteeEmail = n;
  }

  const daysRaw = Number(body.validityDays);
  const validityDays = Number.isFinite(daysRaw) ? Math.min(30, Math.max(1, Math.floor(daysRaw))) : 7;

  const limited = checkRateLimit(`studio-invite-create:${affiliateId}`, CREATE_INVITE_LIMIT, CREATE_INVITE_WINDOW_MS);
  if (!limited.ok) {
    const sec = Math.ceil(limited.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Trop d’invitations créées. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(sec) } },
    );
  }

  const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

  let invite:
    | {
        id: string;
        expiresAt: Date;
        inviteeEmail: string | null;
        createdAt: Date;
      }
    | undefined;
  let raw: string | undefined;

  for (let attempt = 0; attempt < 5; attempt++) {
    const gen = generateInviteToken();
    try {
      invite = await prisma.studioClientInvite.create({
        data: {
          tokenHash: gen.tokenHash,
          affiliateUserId: affiliateId,
          ...(inviteeEmail != null ? { inviteeEmail } : {}),
          expiresAt,
        },
        select: { id: true, expiresAt: true, inviteeEmail: true, createdAt: true },
      });
      raw = gen.raw;
      break;
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          continue;
        }
        if (e.code === "P2021" || e.code === "P2022") {
          console.error("STUDIO INVITE CREATE (schéma DB):", e.code, e.meta);
          return NextResponse.json(
            {
              error:
                "Base de données non à jour : appliquez les migrations Prisma (`npx prisma migrate deploy`) puis redémarrez le serveur.",
            },
            { status: 503 },
          );
        }
        if (e.code === "P2003") {
          return NextResponse.json({ error: "Référence utilisateur invalide. Reconnectez-vous." }, { status: 400 });
        }
      }
      console.error("STUDIO INVITE CREATE", e);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }

  if (!invite || !raw) {
    return NextResponse.json({ error: "Impossible de générer un jeton unique. Réessayez." }, { status: 503 });
  }

  const origin = inviteOrigin(req);
  const invitePath = `/invite/studio/${raw}`;
  const inviteUrl = origin ? `${origin}${invitePath}` : invitePath;

  return NextResponse.json(
    {
      id: invite.id,
      inviteUrl,
      expiresAt: invite.expiresAt,
      inviteeEmail: invite.inviteeEmail,
      createdAt: invite.createdAt,
      _notice: "Copiez le lien maintenant : il ne pourra plus être affiché en clair.",
    },
    { status: 201 },
  );
}

/** DELETE — révoquer une invitation ?id= */
export async function DELETE(req: Request) {
  const affiliateId = await requireAffiliate();
  if (!affiliateId) {
    return NextResponse.json({ error: "Réservé aux comptes Studio (affilié)" }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const existing = await prisma.studioClientInvite.findFirst({
    where: { id, affiliateUserId: affiliateId },
    select: { id: true, acceptedAt: true },
  });

  if (!existing) return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });

  if (existing.acceptedAt) {
    return NextResponse.json({ error: "Invitation déjà acceptée" }, { status: 409 });
  }

  await prisma.studioClientInvite.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
