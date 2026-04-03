import { prisma } from "@/lib/prisma";
import { requireAffiliateur } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET — Liste toutes les capsules des clients de l'affiliateur
export async function GET() {
  try {
    const userId = await requireAffiliateur();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const capsules = await prisma.capsule.findMany({
      where: {
        identity: {
          user: { affiliatorId: userId },
        },
      },
      include: {
        identity: {
          select: {
            id: true,
            name: true,
            slug: true,
            user: {
              select: { id: true, email: true },
            },
          },
        },
        options: {
          include: { branch: true },
        },
        _count: {
          select: {
            sessions: true,
            favorites: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(capsules);
  } catch (error) {
    console.error("GET AFFILIATEUR CAPSULES ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer une capsule pour un client
export async function POST(req: Request) {
  try {
    const userId = await requireAffiliateur();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { title, objective, identityId } = body;

    if (!title || !objective || !identityId) {
      return NextResponse.json(
        { error: "Titre, objectif et identité requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'identité appartient à un client de l'affiliateur
    const identity = await prisma.identityProfile.findUnique({
      where: { id: identityId },
      include: { user: { select: { affiliatorId: true } } },
    });

    if (!identity || identity.user.affiliatorId !== userId) {
      return NextResponse.json(
        { error: "Identité non trouvée ou non autorisée" },
        { status: 403 }
      );
    }

    const capsule = await prisma.capsule.create({
      data: {
        title,
        objective,
        identityId,
      },
      include: {
        identity: {
          select: { name: true, slug: true },
        },
      },
    });

    return NextResponse.json(capsule, { status: 201 });
  } catch (error) {
    console.error("CREATE AFFILIATEUR CAPSULE ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
