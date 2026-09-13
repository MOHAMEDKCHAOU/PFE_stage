import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requirePermission("admin:capsules:moderate");
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const capsules = await prisma.capsule.findMany({
    where: search ? { title: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      objective: true,
      isPublished: true,
      createdAt: true,
      identity: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          user: { select: { id: true, email: true } },
        },
      },
      _count: { select: { options: true, sessions: true, comments: true } },
    },
  });

  return NextResponse.json(capsules);
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission("admin:capsules:moderate");
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const capsule = await prisma.capsule.findUnique({
    where: { id },
    select: { id: true, title: true, identity: { select: { userId: true } } },
  });
  if (!capsule) return NextResponse.json({ error: "Capsule introuvable" }, { status: 404 });

  const sessions = await prisma.capsuleSession.findMany({ where: { capsuleId: id }, select: { id: true } });
  const sessionIds = sessions.map((session) => session.id);
  const options = await prisma.capsuleOption.findMany({ where: { capsuleId: id }, select: { id: true } });
  const optionIds = options.map((option) => option.id);

  await prisma.$transaction([
    prisma.capsuleEvent.deleteMany({ where: { sessionId: { in: sessionIds } } }),
    prisma.capsuleSession.deleteMany({ where: { capsuleId: id } }),
    prisma.capsuleBranch.deleteMany({ where: { optionId: { in: optionIds } } }),
    prisma.capsuleOption.deleteMany({ where: { capsuleId: id } }),
    prisma.capsuleComment.deleteMany({ where: { capsuleId: id } }),
    prisma.favorite.deleteMany({ where: { capsuleId: id } }),
    prisma.capsule.delete({ where: { id } }),
  ]);

  await writeAuditLog({
    actorUserId: auth.userId,
    action: "CAPSULE_MODERATED",
    targetType: "Capsule",
    targetId: id,
    metadata: { action: "DELETE", title: capsule.title, ownerUserId: capsule.identity.userId },
  });

  return NextResponse.json({ success: true });
}
