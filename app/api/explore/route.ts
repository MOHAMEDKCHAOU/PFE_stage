import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") || "";
  const type = req.nextUrl.searchParams.get("type") || "";

  const identities = await prisma.identityProfile.findMany({
    where: {
      AND: [
        // Must have at least one capsule
        { capsules: { some: {} } },
        // Search filter
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { headline: { contains: search, mode: "insensitive" } },
                { bio: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        // Type filter
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
}
