import { prisma } from "@/lib/prisma";
import { requireAffiliateur } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

// GET — Liste des clients de l'affiliateur
export async function GET() {
  try {
    const userId = await requireAffiliateur();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const clients = await prisma.user.findMany({
      where: { affiliatorId: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        identityProfiles: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            avatar: true,
            _count: {
              select: {
                capsules: true,
                portfolioProjects: true,
              },
            },
          },
        },
        _count: {
          select: {
            identityProfiles: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("GET AFFILIATEUR CLIENTS ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer/inviter un nouveau client
export async function POST(req: Request) {
  try {
    const userId = await requireAffiliateur();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { email, password, name, type } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom requis" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const slug = `${slugBase}-${Date.now()}`;

    const client = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "USER",
        affiliatorId: userId,
        identityProfiles: {
          create: {
            name,
            slug,
            type: type || "FREELANCER",
          },
        },
      },
      include: { identityProfiles: true },
    });

    const { password: _, ...clientWithoutPassword } = client;
    return NextResponse.json(clientWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("CREATE CLIENT ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
