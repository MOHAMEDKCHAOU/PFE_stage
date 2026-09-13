import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requirePermission("admin:stats:read");
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalIdentities,
    totalCapsules,
    totalProjects,
    totalTestimonials,
    totalSessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.identityProfile.count(),
    prisma.capsule.count(),
    prisma.portfolioProject.count(),
    prisma.testimonial.count(),
    prisma.capsuleSession.count(),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, email: true, role: true, status: true, createdAt: true },
  });

  const recentCapsules = await prisma.capsule.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      createdAt: true,
      identity: { select: { name: true, user: { select: { email: true } } } },
    },
  });

  return NextResponse.json({
    viewer: { role: auth.role, permissions: auth.permissions },
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalIdentities,
    totalCapsules,
    totalProjects,
    totalTestimonials,
    totalSessions,
    recentUsers,
    recentCapsules,
  });
}
