import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search") || "";

  const users = await prisma.user.findMany({
    where: search
      ? { email: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          identityProfiles: true,
        },
      },
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
              testimonials: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(users);
}

export async function PUT(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const { id, role } = body;

  if (!id || !role || !["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  // Prevent admin from removing their own admin role
  if (id === adminId && role !== "ADMIN") {
    return NextResponse.json({ error: "Vous ne pouvez pas retirer votre propre rôle admin" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  // Prevent self-deletion
  if (id === adminId) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
  }

  // Delete all nested data for user
  const identities = await prisma.identityProfile.findMany({
    where: { userId: id },
    select: { id: true },
  });

  const identityIds = identities.map((i) => i.id);

  // Delete in order: events → sessions → branches → options → capsules → testimonials → projects → identities → user
  const capsules = await prisma.capsule.findMany({
    where: { identityId: { in: identityIds } },
    select: { id: true },
  });
  const capsuleIds = capsules.map((c) => c.id);

  const sessions = await prisma.capsuleSession.findMany({
    where: { capsuleId: { in: capsuleIds } },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);

  const options = await prisma.capsuleOption.findMany({
    where: { capsuleId: { in: capsuleIds } },
    select: { id: true },
  });
  const optionIds = options.map((o) => o.id);

  await prisma.$transaction([
    prisma.capsuleEvent.deleteMany({ where: { sessionId: { in: sessionIds } } }),
    prisma.capsuleSession.deleteMany({ where: { capsuleId: { in: capsuleIds } } }),
    prisma.capsuleBranch.deleteMany({ where: { optionId: { in: optionIds } } }),
    prisma.capsuleOption.deleteMany({ where: { capsuleId: { in: capsuleIds } } }),
    prisma.capsule.deleteMany({ where: { identityId: { in: identityIds } } }),
    prisma.testimonial.deleteMany({ where: { identityId: { in: identityIds } } }),
    prisma.portfolioProject.deleteMany({ where: { identityId: { in: identityIds } } }),
    prisma.identityProfile.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
