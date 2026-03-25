import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "avatar" or "cover"

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez JPG, PNG, WebP ou GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 5 Mo" },
        { status: 400 }
      );
    }

    const folder = type === "cover" ? "covers" : "avatars";
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = `${userId}-${randomUUID().slice(0, 8)}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, bytes);

    const url = `/uploads/${folder}/${safeName}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
