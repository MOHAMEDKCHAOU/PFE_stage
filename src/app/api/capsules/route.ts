import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

// REST Route: GET /api/capsules (Public = for visitors)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const identityId = searchParams.get("identityId");
    
    if (!identityId) {
      return NextResponse.json({ error: "Le paramètre identityId est requis" }, { status: 400 });
    }

    const capsules = await prisma.capsule.findMany({
      where: { identityId },
      include: {
        options: {
          include: {
            branch: true,
          }
        }
      }
    });

    return NextResponse.json(capsules);
  } catch (error) {
    console.error("GET CAPSULES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// REST Route: POST /api/capsules (Protected = for creators)
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { identityId, title, objective } = await req.json();

    if (!identityId || !title || !objective) {
      return NextResponse.json({ error: "identityId, title et objective requis" }, { status: 400 });
    }

    // Sécurité : vérifier que l'identité appartient bien au userId session
    const identity = await prisma.identityProfile.findUnique({ where: { id: identityId }});
    if (!identity || identity.userId !== userId) {
      return NextResponse.json({ error: "Identité non autorisée" }, { status: 403 });
    }

    const capsule = await prisma.capsule.create({
      data: { title, objective, identityId }
    });

    return NextResponse.json(capsule, { status: 201 });
  } catch (error) {
    console.error("POST CAPSULES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// REST Route: DELETE /api/capsules
export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "L'ID est requis" }, { status: 400 });

    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: { identity: true }
    });

    if (!capsule || capsule.identity.userId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.capsule.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Capsule supprimée" });
  } catch (error) {
    console.error("DELETE CAPSULES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
