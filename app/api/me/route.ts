import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        identityProfiles: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            bio: true,
            headline: true,
            avatar: true,
            cover: true,
            createdAt: true,
            _count: {
              select: {
                portfolioProjects: true,
                testimonials: true,
                capsules: true,
              },
            },
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET ME ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
