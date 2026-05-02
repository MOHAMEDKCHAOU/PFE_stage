import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { canManageIdentityAsOwner } from "@/lib/studio-access";
import { assertCanCreateCapsule } from "@/lib/subscription-guards";
import { NextResponse } from "next/server";

// REST Route: GET /api/capsules (Public = for visitors)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const identityId = searchParams.get("identityId");
    const capsuleId = searchParams.get("capsuleId");

    if (capsuleId) {
      const userId = await getUserId();
      if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      const cap = await prisma.capsule.findUnique({
        where: { id: capsuleId },
        include: {
          identity: true,
          options: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: { branch: true },
          },
        },
      });
      if (!cap || !(await canManageIdentityAsOwner(userId, cap.identity.userId))) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
      return NextResponse.json(cap);
    }

    if (!identityId) {
      return NextResponse.json({ error: "Le paramètre identityId est requis" }, { status: 400 });
    }

    const capsules = await prisma.capsule.findMany({
      where: { identityId },
      include: {
        options: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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

    const body = await req.json();
    const { identityId, title, objective, layoutPreset, isPublished, editorHotspots } = body;

    if (!identityId || !title || !objective) {
      return NextResponse.json({ error: "identityId, title et objective requis" }, { status: 400 });
    }

    // Sécurité : vérifier que l'identité appartient bien au userId session
    const identity = await prisma.identityProfile.findUnique({ where: { id: identityId }});
    if (!identity || !(await canManageIdentityAsOwner(userId, identity.userId))) {
      return NextResponse.json({ error: "Identité non autorisée" }, { status: 403 });
    }

    const capQuota = await assertCanCreateCapsule(userId, identity.userId);
    if (capQuota) {
      return NextResponse.json({ error: capQuota.error }, { status: capQuota.status });
    }

    const published =
      typeof isPublished === "boolean" ? isPublished : true;

    const capsule = await prisma.capsule.create({
      data: {
        title,
        objective,
        identityId,
        layoutPreset: layoutPreset ?? null,
        isPublished: published,
        editorHotspots: editorHotspots ?? undefined,
      },
    });

    return NextResponse.json(capsule, { status: 201 });
  } catch (error) {
    console.error("POST CAPSULES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// REST Route: PUT /api/capsules (Protected = for creators)
export async function PUT(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { id, title, objective, layoutPreset, isPublished, editorHotspots } = body;

    if (!id) return NextResponse.json({ error: "L'ID de la capsule est requis" }, { status: 400 });

    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: { identity: true },
    });

    if (!capsule || !(await canManageIdentityAsOwner(userId, capsule.identity.userId))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updated = await prisma.capsule.update({
      where: { id },
      data: {
        title: title ?? capsule.title,
        objective: objective ?? capsule.objective,
        layoutPreset: layoutPreset !== undefined ? layoutPreset : capsule.layoutPreset,
        isPublished: typeof isPublished === "boolean" ? isPublished : capsule.isPublished,
        ...(editorHotspots !== undefined && { editorHotspots }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT CAPSULES ERROR", error);
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

    if (!capsule || !(await canManageIdentityAsOwner(userId, capsule.identity.userId))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.capsule.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Capsule supprimée" });
  } catch (error) {
    console.error("DELETE CAPSULES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
