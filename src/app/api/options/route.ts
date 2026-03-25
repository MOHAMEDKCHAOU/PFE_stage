import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

// REST Route: POST /api/options (Protégé)
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { capsuleId, label } = await req.json();

    if (!capsuleId || !label) {
      return NextResponse.json({ error: "capsuleId et label requis" }, { status: 400 });
    }

    // Vérifier que la capsule appartient au user
    const capsule = await prisma.capsule.findUnique({
      where: { id: capsuleId },
      include: { identity: true },
    });

    if (!capsule || capsule.identity.userId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const option = await prisma.capsuleOption.create({
      data: { capsuleId, label },
    });

    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    console.error("POST OPTIONS ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// REST Route: PUT /api/options (Protégé)
export async function PUT(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id, label } = await req.json();
    if (!id || !label) return NextResponse.json({ error: "id et label requis" }, { status: 400 });

    // Vérifier que l'option appartient bien au user
    const existing = await prisma.capsuleOption.findUnique({
      where: { id },
      include: { capsule: { include: { identity: true } } },
    });

    if (!existing || existing.capsule.identity.userId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const option = await prisma.capsuleOption.update({
      where: { id },
      data: { label },
    });

    return NextResponse.json(option);
  } catch (error) {
    console.error("PUT OPTIONS ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// REST Route: DELETE /api/options (Protégé)
export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "L'ID est requis" }, { status: 400 });

    // Vérifier que l'option appartient bien au user
    const existing = await prisma.capsuleOption.findUnique({
      where: { id },
      include: { capsule: { include: { identity: true } } },
    });

    if (!existing || existing.capsule.identity.userId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.capsuleOption.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Option supprimée" });
  } catch (error) {
    console.error("DELETE OPTIONS ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
