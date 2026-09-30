import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const space = await prisma.smartSpace.findFirst({
    where: { id, userId: auth.userId },
    include: { scenes: { orderBy: { sortOrder: "asc" }, include: { hotspots: true, captures: true } } },
  });
  return space ? NextResponse.json({ space }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as { title?: string; description?: string; status?: string } | null;
  const found = await prisma.smartSpace.findFirst({ where: { id, userId: auth.userId }, select: { id: true } });
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, string | null> = {};
  if (body?.title?.trim()) data.title = body.title.trim().slice(0, 120);
  if (typeof body?.description === "string") data.description = body.description.trim().slice(0, 1200) || null;
  if (body?.status && ["DRAFT", "CAPTURING", "PROCESSING", "READY", "PUBLISHED"].includes(body.status)) data.status = body.status;
  if (data.status === "PUBLISHED") {
    const withPanorama = await prisma.smartSpaceScene.count({ where: { spaceId: id, panoramaUrl: { not: null } } });
    if (withPanorama === 0) {
      return NextResponse.json({ error: "Publication impossible : aucune scène reconstruite." }, { status: 400 });
    }
  }
  const space = await prisma.smartSpace.update({ where: { id }, data });
  return NextResponse.json({ space });
}
