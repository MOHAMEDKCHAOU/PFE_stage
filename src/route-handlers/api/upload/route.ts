import { createHash } from "crypto";
import { stat } from "fs/promises";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseUploadType, resolveUploadFile, saveUpload, SOURCE_BY_TYPE } from "@/lib/asset-storage";
import { sanitizeImage } from "@/lib/image-sanitize";
import { detectMedia, formatMaxSize, MAX_BYTES, UNSUPPORTED_FORMAT_ERROR } from "@/lib/media-validation";
import { ASSET_SELECT } from "@/lib/user-assets";
import { NextResponse } from "next/server";

/** Garde-fou avant lecture complète : aucun format accepté ne dépasse 80 Mo. */
const ABSOLUTE_MAX_BYTES = Math.max(...Object.values(MAX_BYTES));

/** Nom d’origine pour l’affichage uniquement (jamais utilisé comme chemin). */
function displayName(raw: string): string | null {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 160);
  return clean || null;
}

async function fileExists(url: string) {
  const file = resolveUploadFile(url);
  if (!file) return false;
  return stat(file).then(() => true, () => false);
}

/** POST /api/upload — FormData { file, type: avatar|cover|portfolio|library|logo } */
export async function POST(req: Request) {
  try {
    const auth = await requirePermission("assets:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const formData = await req.formData();
    const file = formData.get("file");
    const type = parseUploadType(formData.get("type"));

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }
    if (file.size > ABSOLUTE_MAX_BYTES) {
      return NextResponse.json({ error: `Fichier trop volumineux (max ${formatMaxSize("VIDEO")})` }, { status: 413 });
    }

    const original = Buffer.from(await file.arrayBuffer());
    const detected = detectMedia(original, file.name);
    if (!detected) return NextResponse.json({ error: UNSUPPORTED_FORMAT_ERROR }, { status: 400 });

    if (original.length > MAX_BYTES[detected.kind]) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${formatMaxSize(detected.kind)} pour ce type)` },
        { status: 413 },
      );
    }
    if ((type === "avatar" || type === "cover" || type === "logo") && detected.kind !== "IMAGE") {
      return NextResponse.json({ error: "Avatar, couverture et logo acceptent uniquement des images" }, { status: 400 });
    }

    // Même fichier déjà présent dans la bibliothèque : on le réutilise au lieu de le dupliquer.
    const sha256 = createHash("sha256").update(original).digest("hex");
    const duplicate = await prisma.userAsset.findFirst({ where: { userId, sha256 }, select: ASSET_SELECT });
    if (duplicate && (await fileExists(duplicate.url))) {
      return NextResponse.json(
        { url: duplicate.url, kind: duplicate.kind, sizeBytes: duplicate.sizeBytes, mimeType: duplicate.mimeType, asset: duplicate, deduplicated: true },
        { status: 200 },
      );
    }

    let data: Uint8Array = original;
    let width: number | null = null;
    let height: number | null = null;
    if (detected.kind === "IMAGE") {
      try {
        const clean = await sanitizeImage(original, detected.ext);
        data = clean.buffer;
        width = clean.width;
        height = clean.height;
      } catch {
        return NextResponse.json({ error: "Image illisible ou corrompue." }, { status: 400 });
      }
    }

    const url = await saveUpload(type, detected.ext, data);
    const asset = await prisma.userAsset.create({
      data: {
        userId,
        url,
        kind: detected.kind,
        mimeType: detected.mime,
        sizeBytes: data.length,
        originalName: displayName(file.name),
        width,
        height,
        sha256,
        source: SOURCE_BY_TYPE[type],
      },
      select: ASSET_SELECT,
    });

    return NextResponse.json(
      { url, kind: asset.kind, sizeBytes: asset.sizeBytes, mimeType: asset.mimeType, asset },
      { status: 201 },
    );
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
