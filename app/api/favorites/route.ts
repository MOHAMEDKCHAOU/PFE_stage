import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET — list user's favorites
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      capsule: {
        select: {
          id: true,
          title: true,
          objective: true,
          identity: {
            select: {
              name: true,
              slug: true,
              type: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(favorites);
}

// POST — add capsule to favorites
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { capsuleId } = await req.json();
  if (!capsuleId) return NextResponse.json({ error: "capsuleId requis" }, { status: 400 });

  // Check capsule exists
  const capsule = await prisma.capsule.findUnique({ where: { id: capsuleId } });
  if (!capsule) return NextResponse.json({ error: "Capsule introuvable" }, { status: 404 });

  // Check if already favorited
  const existing = await prisma.favorite.findUnique({
    where: { userId_capsuleId: { userId, capsuleId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Déjà en favoris" }, { status: 409 });
  }

  const favorite = await prisma.favorite.create({
    data: { userId, capsuleId },
  });

  return NextResponse.json(favorite, { status: 201 });
}

// DELETE — remove capsule from favorites
export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const capsuleId = req.nextUrl.searchParams.get("capsuleId");
  if (!capsuleId) return NextResponse.json({ error: "capsuleId requis" }, { status: 400 });

  await prisma.favorite.deleteMany({
    where: { userId, capsuleId },
  });

  return NextResponse.json({ success: true });
}
