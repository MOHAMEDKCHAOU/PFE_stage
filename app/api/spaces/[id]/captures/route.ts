import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { detectMedia } from "@/lib/media-validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const space = await prisma.smartSpace.findFirst({ where: { id, userId: auth.userId }, include: { scenes: { orderBy: { sortOrder: "asc" }, take: 1 } } });
  if (!space || !space.scenes[0]) return NextResponse.json({ error: "Space not found" }, { status: 404 });
  const form = await request.formData();
  const files = form.getAll("frames").filter((value): value is File => value instanceof File);
  if (!files.length || files.length > 48) return NextResponse.json({ error: "Upload between 1 and 48 frames" }, { status: 400 });
  const scene = space.scenes[0];
  const dir = path.join(process.cwd(), "public", "uploads", "spaces", scene.id);
  await mkdir(dir, { recursive: true });
  const created = [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    if (file.size > 12_000_000) continue;
    const bytes = Buffer.from(await file.arrayBuffer());
    // Type réel lu dans le contenu : seules des images JPEG / PNG sont acceptées comme frames.
    const detected = detectMedia(bytes);
    if (!detected || (detected.ext !== "jpg" && detected.ext !== "png")) continue;
    const filename = `frame-${Date.now()}-${i}.${detected.ext}`;
    await writeFile(path.join(dir, filename), bytes);
    created.push(await prisma.smartSpaceCapture.create({ data: { sceneId: scene.id, assetUrl: `/uploads/spaces/${scene.id}/${filename}` } }));
  }
  await prisma.smartSpaceScene.update({ where: { id: scene.id }, data: { status: "CAPTURING" } });
  return NextResponse.json({ captured: created.length, sceneId: scene.id });
}
