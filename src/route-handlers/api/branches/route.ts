import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { canManageIdentityAsOwner } from "@/lib/studio-access";
import { NextResponse } from "next/server";

// REST Route: POST /api/branches (Protégé)
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { optionId, headline, description, cta, proof } = await req.json();

    if (!optionId || !headline || !description || !cta) {
      return NextResponse.json(
        { error: "Champs requis manquants : optionId, headline, description, cta" },
        { status: 400 }
      );
    }

    const optionRow = await prisma.capsuleOption.findUnique({
      where: { id: optionId },
      include: { capsule: { include: { identity: true } } },
    });
    if (!optionRow || !(await canManageIdentityAsOwner(userId, optionRow.capsule.identity.userId))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const branch = await prisma.capsuleBranch.create({
      data: { optionId, headline, description, cta, proof: proof || null },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("POST BRANCHES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// REST Route: PUT /api/branches (Protégé)
export async function PUT(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id, headline, description, cta, proof } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    // Vérifier que la branch appartient bien au user
    const existing = await prisma.capsuleBranch.findUnique({
      where: { id },
      include: {
        option: { include: { capsule: { include: { identity: true } } } },
      },
    });

    if (!existing || !(await canManageIdentityAsOwner(userId, existing.option.capsule.identity.userId))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const branch = await prisma.capsuleBranch.update({
      where: { id },
      data: { headline, description, cta, proof },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error("PUT BRANCHES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// REST Route: DELETE /api/branches (Protégé)
export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "L'ID est requis" }, { status: 400 });

    // Vérifier que la branch appartient bien au user
    const existing = await prisma.capsuleBranch.findUnique({
      where: { id },
      include: {
        option: { include: { capsule: { include: { identity: true } } } },
      },
    });

    if (!existing || !(await canManageIdentityAsOwner(userId, existing.option.capsule.identity.userId))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.capsuleBranch.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Branch supprimée" });
  } catch (error) {
    console.error("DELETE BRANCHES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
