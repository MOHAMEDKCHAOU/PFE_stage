import { prisma } from "@/lib/prisma";
import { requireAffiliate } from "@/lib/auth";
import { NextResponse } from "next/server";

/** GET /api/studio/clients — clients liés au Studio (rôle AFFILIATE). */
export async function GET() {
  const affiliateId = await requireAffiliate();
  if (!affiliateId) {
    return NextResponse.json({ error: "Réservé aux comptes Studio (affilié)" }, { status: 403 });
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
  if (!affiliateId) {
    return NextResponse.json({ error: "Réservé aux comptes Studio (affilié)" }, { status: 403 });
  }

  const body = await req.json();
  const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
  if (!emailRaw) {
    return NextResponse.json({ error: "email requis" }, { status: 400 });
  }

  const client = await prisma.user.findFirst({
    where: { email: { equals: emailRaw, mode: "insensitive" } },
    select: { id: true, email: true, role: true },
  });

  if (!client) {
    return NextResponse.json(
      { error: "Aucun compte Faymoos avec cet email — le client doit d’abord s’inscrire." },
      { status: 404 },
    );
  }

  if (client.id === affiliateId) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous ajouter comme client" }, { status: 400 });
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
      return NextResponse.json({ error: "Ce client est déjà lié à votre Studio" }, { status: 409 });
    }
    console.error("POST STUDIO CLIENTS", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** DELETE /api/studio/clients?clientUserId= — retirer le lien. */
export async function DELETE(req: Request) {
  const affiliateId = await requireAffiliate();
  if (!affiliateId) {
    return NextResponse.json({ error: "Réservé aux comptes Studio (affilié)" }, { status: 403 });
  }

  const clientUserId = new URL(req.url).searchParams.get("clientUserId");
  if (!clientUserId) {
    return NextResponse.json({ error: "clientUserId requis" }, { status: 400 });
  }

  const result = await prisma.affiliateClient.deleteMany({
    where: { affiliateUserId: affiliateId, clientUserId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
