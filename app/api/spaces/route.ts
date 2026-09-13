import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "space";
}

export async function GET() {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const spaces = await prisma.smartSpace.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    include: { identity: { select: { name: true, slug: true } }, scenes: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, status: true, panoramaUrl: true } } },
  });
  return NextResponse.json({ spaces });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { title?: string; identityId?: string; description?: string } | null;
  if (!body?.title?.trim() || !body.identityId) return NextResponse.json({ error: "title and identityId are required" }, { status: 400 });
  const identity = await prisma.identityProfile.findFirst({ where: { id: body.identityId, userId: auth.userId }, select: { id: true } });
  if (!identity) return NextResponse.json({ error: "Identity not found" }, { status: 404 });
  const base = slugify(body.title);
  let slug = base;
  for (let i = 0; await prisma.smartSpace.findUnique({ where: { slug }, select: { id: true } }); i += 1) slug = `${base}-${i + 2}`;
  const space = await prisma.smartSpace.create({
    data: {
      userId: auth.userId,
      identityId: identity.id,
      title: body.title.trim().slice(0, 120),
      description: body.description?.trim().slice(0, 1200) || null,
      slug,
      status: "CAPTURING",
      scenes: { create: { name: "Main room", sortOrder: 0, status: "CAPTURING" } },
    },
    include: { scenes: true },
  });
  return NextResponse.json({ space }, { status: 201 });
}
