import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search") || "";

  const capsules = await prisma.capsule.findMany({
    where: search
      ? { title: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      objective: true,
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
      _count: {
        select: {
          options: true,
          sessions: true,
        },
      },
    },
  });

  return NextResponse.json(capsules);
}

export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const sessions = await prisma.capsuleSession.findMany({
    where: { capsuleId: id },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);

  const options = await prisma.capsuleOption.findMany({
    where: { capsuleId: id },
    select: { id: true },
  });
  const optionIds = options.map((o) => o.id);

  await prisma.$transaction([
    prisma.capsuleEvent.deleteMany({ where: { sessionId: { in: sessionIds } } }),
    prisma.capsuleSession.deleteMany({ where: { capsuleId: id } }),
    prisma.capsuleBranch.deleteMany({ where: { optionId: { in: optionIds } } }),
    prisma.capsuleOption.deleteMany({ where: { capsuleId: id } }),
    prisma.capsule.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
