import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const space = await prisma.smartSpace.findFirst({ where: { id, userId: auth.userId }, include: { scenes: { orderBy: { sortOrder: "asc" }, take: 1 } } });
  const scene = space?.scenes[0];
  if (!scene) return NextResponse.json({ error: "Space not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as { label?: string; type?: string; yaw?: number; pitch?: number; targetUrl?: string; targetSceneId?: string } | null;
  if (!body?.label || typeof body.yaw !== "number" || typeof body.pitch !== "number") return NextResponse.json({ error: "label, yaw and pitch are required" }, { status: 400 });
  const hotspot = await prisma.smartSpaceHotspot.create({
    data: {
      sceneId: scene.id,
      label: body.label.slice(0, 120),
      type: ["INFO", "PROJECT", "VIDEO", "CTA", "NAVIGATION", "LINK"].includes(body.type || "") ? body.type! : "INFO",
      yaw: Math.max(-180, Math.min(180, body.yaw)),
      pitch: Math.max(-90, Math.min(90, body.pitch)),
      targetUrl: body.targetUrl?.slice(0, 800) || null,
      targetSceneId: body.targetSceneId || null,
    },
  });
  return NextResponse.json({ hotspot }, { status: 201 });
}
