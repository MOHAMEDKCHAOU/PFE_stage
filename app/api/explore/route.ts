import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";
    const type = req.nextUrl.searchParams.get("type") || "";

    const identities = await prisma.identityProfile.findMany({
      where: {
        AND: [
          { capsules: { some: {} } },
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { headline: { contains: search, mode: "insensitive" } },
                  { bio: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          type ? { type } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        headline: true,
        bio: true,
        avatar: true,
        cover: true,
        theme: true,
        _count: {
          select: {
            capsules: true,
            portfolioProjects: true,
            testimonials: true,
          },
        },
        capsules: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            objective: true,
          },
        },
      },
    });

    return NextResponse.json(identities);
  } catch (error) {
    console.error("EXPLORE ERROR:", error);
    return NextResponse.json([], { status: 200 });
  }
}
