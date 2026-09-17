import { prisma } from "@/lib/prisma";
import { getAuthContext, getUserId, requirePermission } from "@/lib/auth";
import { canManageIdentityAsOwner } from "@/lib/studio-access";
import { syncAutoBadgesForUser } from "@/lib/faymoos-badges";
import { hasPermission } from "@/lib/rbac-policy";
import { assertCanCreateCapsule } from "@/lib/subscription-guards";
import { NextResponse } from "next/server";

// REST Route: GET /api/capsules (Public = for visitors)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const identityId = searchParams.get("identityId");
    const capsuleId = searchParams.get("capsuleId");

    if (capsuleId) {
      const auth = await requirePermission("capsules:manage");
    if (!auth) {
      const userId = await getUserId();

      if (!userId) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
      const userId = auth.userId;
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
        return NextResponse.json({ error: "Non autorisÃ©" }, { status: 403 });
      }
      return NextResponse.json(cap);
    }

    if (!identityId) {
      return NextResponse.json({ error: "Le paramÃ¨tre identityId est requis" }, { status: 400 });
    }

    // Public viewers only receive published capsules. Owners and authorized Studio
    // delegates can still load drafts from the same endpoint for the dashboard.
    const identity = await prisma.identityProfile.findUnique({
      where: { id: identityId },
      select: { userId: true },
    });
    if (!identity) return NextResponse.json([]);

    const auth = await getAuthContext();
    const canManage = Boolean(
      auth &&
        hasPermission(auth.role, "capsules:manage") &&
        (await canManageIdentityAsOwner(auth.userId, identity.userId)),
    );

    const capsules = await prisma.capsule.findMany({
      where: { identityId, ...(canManage ? {} : { isPublished: true }) },
      include: {
        options: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            branch: true,
          },
        },
      },
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
    const auth = await requirePermission("capsules:manage");
    if (!auth) {
      const userId = await getUserId();

      if (!userId) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const userId = auth.userId;

    const body = await req.json();
    const { identityId, title, objective, layoutPreset, isPublished, editorHotspots } = body;
    const wantsPublished = typeof isPublished === "boolean" ? isPublished : true;

    if (wantsPublished && !hasPermission(auth.role, "capsules:publish")) {
      return NextResponse.json({ error: "Permission de publication requise" }, { status: 403 });
    }

    if (!identityId || !title || !objective) {
      return NextResponse.json({ error: "identityId, title et objective requis" }, { status: 400 });
    }

    // SÃ©curitÃ© : vÃ©rifier que l'identitÃ© appartient bien au userId session
    const identity = await prisma.identityProfile.findUnique({ where: { id: identityId }});
    if (!identity || !(await canManageIdentityAsOwner(userId, identity.userId))) {
      return NextResponse.json({ error: "IdentitÃ© non autorisÃ©e" }, { status: 403 });
    }

    const capQuota = await assertCanCreateCapsule(userId, identity.userId);
    if (capQuota) {
      return NextResponse.json({ error: capQuota.error }, { status: capQuota.status });
    }

    const published = wantsPublished;

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

    await syncAutoBadgesForUser(identity.userId);
    return NextResponse.json(capsule, { status: 201 });
  } catch (error) {
    console.error("POST CAPSULES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// REST Route: PUT /api/capsules (Protected = for creators)
export async function PUT(req: Request) {
  try {
    const auth = await requirePermission("capsules:manage");
    if (!auth) {
      const userId = await getUserId();

      if (!userId) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const userId = auth.userId;

    const body = await req.json();
    const { id, title, objective, layoutPreset, isPublished, editorHotspots, commentsEnabled } = body;

    if (isPublished === true && !hasPermission(auth.role, "capsules:publish")) {
      return NextResponse.json({ error: "Permission de publication requise" }, { status: 403 });
    }

    if (!id) return NextResponse.json({ error: "L'ID de la capsule est requis" }, { status: 400 });

    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: { identity: true },
    });

    if (!capsule || !(await canManageIdentityAsOwner(userId, capsule.identity.userId))) {
      return NextResponse.json({ error: "Non autorisÃ©" }, { status: 403 });
    }

    const updated = await prisma.capsule.update({
      where: { id },
      data: {
        title: title ?? capsule.title,
        objective: objective ?? capsule.objective,
        layoutPreset: layoutPreset !== undefined ? layoutPreset : capsule.layoutPreset,
        isPublished: typeof isPublished === "boolean" ? isPublished : capsule.isPublished,
        commentsEnabled:
          typeof commentsEnabled === "boolean" ? commentsEnabled : capsule.commentsEnabled,
        ...(editorHotspots !== undefined && { editorHotspots }),
      },
    });

    await syncAutoBadgesForUser(capsule.identity.userId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT CAPSULES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// REST Route: DELETE /api/capsules
export async function DELETE(req: Request) {
  try {
    const auth = await requirePermission("capsules:manage");
    if (!auth) {
      const userId = await getUserId();

      if (!userId) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const userId = auth.userId;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "L'ID est requis" }, { status: 400 });

    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: { identity: true }
    });

    if (!capsule || !(await canManageIdentityAsOwner(userId, capsule.identity.userId))) {
      return NextResponse.json({ error: "Non autorisÃ©" }, { status: 403 });
    }

    await prisma.capsule.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Capsule supprimÃ©e" });
  } catch (error) {
    console.error("DELETE CAPSULES ERROR", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

