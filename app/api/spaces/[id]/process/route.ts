import { NextRequest, NextResponse } from "next/server";
import { readFile, mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const space = await prisma.smartSpace.findFirst({
    where: { id, userId: auth.userId },
    include: { scenes: { orderBy: { sortOrder: "asc" }, take: 1, include: { captures: true } } },
  });
  const scene = space?.scenes[0];
  if (!space || !scene) return NextResponse.json({ error: "Space not found" }, { status: 404 });
  if (scene.captures.length < 6) return NextResponse.json({ error: "At least 6 useful frames are required" }, { status: 400 });
  await prisma.smartSpace.update({ where: { id }, data: { status: "PROCESSING" } });
  await prisma.smartSpaceScene.update({ where: { id: scene.id }, data: { status: "PROCESSING" } });
  try {
    const form = new FormData();
    for (const capture of scene.captures) {
      const local = path.join(process.cwd(), "public", capture.assetUrl.replace(/^\//, ""));
      const bytes = await readFile(local);
      form.append("files", new Blob([bytes], { type: "image/jpeg" }), path.basename(local));
    }
    const serviceUrl = process.env.VISION360_URL || "http://127.0.0.1:8010";
    const response = await fetch(`${serviceUrl}/stitch`, { method: "POST", body: form, signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Vision service returned ${response.status}`);
    const panorama = Buffer.from(await response.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", "spaces", scene.id);
    await mkdir(dir, { recursive: true });
    const out = path.join(dir, "panorama.jpg");
    await writeFile(out, panorama);
    const panoramaUrl = `/uploads/spaces/${scene.id}/panorama.jpg`;
    await prisma.smartSpaceScene.update({ where: { id: scene.id }, data: { status: "READY", panoramaUrl, previewUrl: panoramaUrl } });
    await prisma.smartSpace.update({ where: { id }, data: { status: "READY", coverUrl: panoramaUrl } });
    return NextResponse.json({ ok: true, panoramaUrl });
  } catch (error) {
    await prisma.smartSpaceScene.update({ where: { id: scene.id }, data: { status: "FAILED" } }).catch(() => undefined);
    await prisma.smartSpace.update({ where: { id }, data: { status: "FAILED" } }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Reconstruction failed" }, { status: 502 });
  }
}
