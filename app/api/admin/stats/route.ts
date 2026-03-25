import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const [totalUsers, totalIdentities, totalCapsules, totalProjects, totalTestimonials, totalSessions] =
    await Promise.all([
      prisma.user.count(),
      prisma.identityProfile.count(),
      prisma.capsule.count(),
      prisma.portfolioProject.count(),
      prisma.testimonial.count(),
      prisma.capsuleSession.count(),
    ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, email: true, role: true, createdAt: true },
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
    totalUsers,
    totalIdentities,
    totalCapsules,
    totalProjects,
    totalTestimonials,
    totalSessions,
    recentUsers,
    recentCapsules,
  });
}
