import { getUserId } from "@/lib/auth";
import { getRecommendedIdentities } from "@/modules/recommendation/recommendation.service";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const sort = req.nextUrl.searchParams.get("sort") || "";
    if (sort === "recommended") {
      const userId = await getUserId();
      const raw = req.nextUrl.searchParams.get("limit");
      const parsed = raw ? parseInt(raw, 10) : 12;
      const limit = Number.isFinite(parsed) ? Math.min(50, Math.max(1, parsed)) : 12;
      const data = await getRecommendedIdentities({ userId, limit });
      return NextResponse.json(data);
    }

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
                  { profession: { contains: search, mode: "insensitive" } },
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
        profession: true,
        tags: true,
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
