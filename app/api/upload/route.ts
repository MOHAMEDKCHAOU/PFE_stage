import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyUploadFile, shouldRecordUserAsset } from "@/lib/asset-upload";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const auth = await requirePermission("assets:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const classified = classifyUploadFile(file);
    if (!classified.ok) {
      return NextResponse.json({ error: classified.error }, { status: 400 });
    }

    if (file.size > classified.maxBytes) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${Math.round(classified.maxBytes / (1024 * 1024))} Mo)` },
        { status: 400 },
      );
    }

    const folder =
      type === "cover"
        ? "covers"
        : type === "portfolio"
          ? "portfolio"
          : type === "library" || type === "asset"
            ? "library"
            : "avatars";

    if (type === "avatar" || type === "cover") {
      if (classified.kind !== "IMAGE") {
        return NextResponse.json({ error: "Avatar et cover acceptent uniquement des images" }, { status: 400 });
      }
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeName = `${userId}-${randomUUID().slice(0, 8)}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, bytes);

    const url = `/uploads/${folder}/${safeName}`;
    const mime = file.type || "application/octet-stream";

    if (shouldRecordUserAsset(type)) {
      await prisma.userAsset.create({
        data: {
          userId,
          url,
          kind: classified.kind,
          mimeType: mime,
          sizeBytes: file.size,
        },
      });
    }

    return NextResponse.json(
      { url, kind: classified.kind, sizeBytes: file.size, mimeType: mime },
      { status: 201 },
    );
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
