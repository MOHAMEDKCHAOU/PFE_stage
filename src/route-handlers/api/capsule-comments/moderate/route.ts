import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageIdentityAsOwner } from "@/lib/studio-access";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/capsule-comments/moderate?capsuleId=&status=PENDING|APPROVED|REJECTED|ALL */
export async function GET(req: Request) {
  try {
    const auth = await requirePermission("comments:moderate");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const { searchParams } = new URL(req.url);
    const capsuleId = searchParams.get("capsuleId");
    const status = searchParams.get("status") ?? "PENDING";

    if (!capsuleId) {
      return NextResponse.json({ error: "capsuleId requis" }, { status: 400 });
    }

    const capsule = await prisma.capsule.findUnique({
      where: { id: capsuleId },
      include: { identity: { select: { userId: true, name: true } } },
    });
    if (!capsule || !(await canManageIdentityAsOwner(userId, capsule.identity.userId))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const whereStatus =
      status === "ALL"
        ? {}
        : status === "PENDING" || status === "APPROVED" || status === "REJECTED"
          ? { status }
          : { status: "PENDING" as const };

    const items = await prisma.capsuleComment.findMany({
      where: {
        capsuleId,
        parentId: null,
        isOwnerReply: false,
        ...whereStatus,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        authorName: true,
        authorEmail: true,
        body: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        children: {
          where: { isOwnerReply: true },
          select: { id: true, authorName: true, body: true, createdAt: true },
        },
      },
    });

    const counts = {
      pending: await prisma.capsuleComment.count({
        where: { capsuleId, parentId: null, isOwnerReply: false, status: "PENDING" },
      }),
      approved: await prisma.capsuleComment.count({
        where: { capsuleId, parentId: null, isOwnerReply: false, status: "APPROVED" },
      }),
      rejected: await prisma.capsuleComment.count({
        where: { capsuleId, parentId: null, isOwnerReply: false, status: "REJECTED" },
      }),
    };

    return NextResponse.json({
      capsule: {
        id: capsule.id,
        title: capsule.title,
        commentsEnabled: capsule.commentsEnabled,
        identityName: capsule.identity.name,
      },
      counts,
      items: items.map((i) => {
        const reply = i.children[0];
        return {
          id: i.id,
          authorName: i.authorName,
          authorEmail: i.authorEmail,
          body: i.body,
          status: i.status,
          createdAt: i.createdAt.toISOString(),
          reviewedAt: i.reviewedAt?.toISOString() ?? null,
          reply: reply
            ? {
                id: reply.id,
                authorName: reply.authorName,
                body: reply.body,
                createdAt: reply.createdAt.toISOString(),
              }
            : null,
        };
      }),
    });
  } catch (e) {
    console.error("GET capsule-comments/moderate", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** PATCH { id, status: APPROVED | REJECTED } */
export async function PATCH(req: Request) {
  try {
    const auth = await requirePermission("comments:moderate");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    const nextStatus = body.status === "APPROVED" || body.status === "REJECTED" ? body.status : null;
    if (!id || !nextStatus) {
      return NextResponse.json({ error: "id et status (APPROVED|REJECTED) requis" }, { status: 400 });
    }

    const row = await prisma.capsuleComment.findUnique({
      where: { id },
      include: {
        capsule: { include: { identity: { select: { userId: true } } } },
        children: true,
      },
    });

    if (
      !row ||
      row.isOwnerReply ||
      !(await canManageIdentityAsOwner(userId, row.capsule.identity.userId))
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      if (nextStatus === "REJECTED" && row.children.length > 0) {
        await tx.capsuleComment.deleteMany({ where: { parentId: row.id, isOwnerReply: true } });
      }
      await tx.capsuleComment.update({
        where: { id },
        data: {
          status: nextStatus,
          reviewedAt: new Date(),
          reviewerUserId: userId,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH capsule-comments/moderate", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** POST { parentCommentId, body } — réponse officielle du créateur */
export async function POST(req: Request) {
  try {
    const auth = await requirePermission("comments:moderate");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const body = await req.json();
    const parentId = typeof body.parentCommentId === "string" ? body.parentCommentId : "";
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!parentId || text.length < 2 || text.length > 2000) {
      return NextResponse.json({ error: "parentCommentId et message (2–2000 car.) requis" }, { status: 400 });
    }

    const parent = await prisma.capsuleComment.findUnique({
      where: { id: parentId },
      include: { capsule: { include: { identity: { select: { userId: true, name: true } } } }, children: true },
    });

    if (
      !parent ||
      parent.isOwnerReply ||
      parent.status !== "APPROVED" ||
      !(await canManageIdentityAsOwner(userId, parent.capsule.identity.userId))
    ) {
      return NextResponse.json(
        { error: "Commentaire parent introuvable, non approuvé ou non autorisé" },
        { status: 403 },
      );
    }

    if (parent.children.some((c) => c.isOwnerReply)) {
      return NextResponse.json({ error: "Une réponse existe déjà pour ce commentaire." }, { status: 409 });
    }

    const reply = await prisma.capsuleComment.create({
      data: {
        capsuleId: parent.capsuleId,
        parentId: parent.id,
        authorName: `${parent.capsule.identity.name} (créateur)`,
        authorEmail: null,
        body: text,
        status: "APPROVED",
        isOwnerReply: true,
        reviewerUserId: userId,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      reply: { id: reply.id, authorName: reply.authorName, body: reply.body, createdAt: reply.createdAt.toISOString() },
    });
  } catch (e) {
    console.error("POST capsule-comments/moderate reply", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
