import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const identities = await prisma.identityProfile.findMany({
      where: { userId },
      include: {
        portfolioProjects: true,
        testimonials: true,
        capsules: {
          include: { options: { include: { branch: true } } }
        },
      }
    });
    return NextResponse.json(identities);
  } catch (error) {
    console.error("GET IDENTITY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { name, type, bio, headline, avatar, cover } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Le nom et le type sont requis" }, { status: 400 });
    }
    
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `${slugBase}-${Date.now()}`;

    const identity = await prisma.identityProfile.create({
      data: {
        userId,
        name,
        slug,
        type,
        bio,
        headline,
        avatar,
        cover,
      }
    });
    return NextResponse.json(identity, { status: 201 });
  } catch (error) {
    console.error("POST IDENTITY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    
    const body = await req.json();
    const { id, name, type, bio, headline, avatar, cover } = body;
    
    if (!id) return NextResponse.json({ error: "L'ID de l'identité est requis" }, { status: 400 });

    // Vérifier si cette identité appartient au user
    const existing = await prisma.identityProfile.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const identity = await prisma.identityProfile.update({
      where: { id }, 
      data: { name, type, bio, headline, avatar, cover }
    });
    return NextResponse.json(identity);
  } catch (error) {
    console.error("PUT IDENTITY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "L'ID de l'identité est requis" }, { status: 400 });

    const existing = await prisma.identityProfile.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    await prisma.identityProfile.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: "Identité supprimée" });
  } catch (error) {
    console.error("DELETE IDENTITY ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
