import { requirePermission } from "@/lib/auth";
import { findAssetUsages } from "@/lib/asset-usage";
import { prisma } from "@/lib/prisma";
import { getManagedUserIdsForViewer } from "@/lib/studio-access";
import { ASSET_ALT_MAX, ASSET_SELECT, ASSET_TAG_LENGTH_MAX, ASSET_TAGS_MAX, ASSET_TITLE_MAX } from "@/lib/user-assets";
import { deleteOwnedAsset, toPublicUsages } from "./shared";
import { NextResponse } from "next/server";

async function ownedAsset(id: string, userId: string) {
  return prisma.userAsset.findFirst({ where: { id, userId }, select: ASSET_SELECT });
}

/** GET /api/assets/[id] — détail + emplacements où le média est utilisé */
export async function getAsset(_req: Request, id: string) {
  const auth = await requirePermission("assets:manage");
  if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const asset = await ownedAsset(id, auth.userId);
  if (!asset) return NextResponse.json({ error: "Média introuvable" }, { status: 404 });

  const managedIds = await getManagedUserIdsForViewer(auth.userId);
  const usages = toPublicUsages(await findAssetUsages(asset.url), managedIds);
  return NextResponse.json({ asset, usages });
}

function normalizeTags(raw: unknown): string[] | { error: string } {
  if (!Array.isArray(raw)) return { error: "tags doit être une liste" };
  const tags = [
    ...new Set(
      raw
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean),
    ),
  ];
  if (tags.length > ASSET_TAGS_MAX) return { error: `${ASSET_TAGS_MAX} tags maximum` };
  if (tags.some((t) => t.length > ASSET_TAG_LENGTH_MAX)) return { error: `Tag trop long (max ${ASSET_TAG_LENGTH_MAX})` };
  return tags;
}

function optionalText(raw: unknown, max: number, field: string): string | null | { error: string } {
  if (raw === null) return null;
  if (typeof raw !== "string") return { error: `${field} invalide` };
  const value = raw.trim();
  if (value.length > max) return { error: `${field} trop long (max ${max})` };
  return value || null;
}

/** PATCH /api/assets/[id] { title?, altText?, tags? } */
export async function updateAsset(req: Request, id: string) {
  const auth = await requirePermission("assets:manage");
  if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const existing = await ownedAsset(id, auth.userId);
  if (!existing) return NextResponse.json({ error: "Média introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });

  const data: { title?: string | null; altText?: string | null; tags?: string[] } = {};
  if (body.title !== undefined) {
    const v = optionalText(body.title, ASSET_TITLE_MAX, "Titre");
    if (v && typeof v === "object") return NextResponse.json(v, { status: 400 });
    data.title = v;
  }
  if (body.altText !== undefined) {
    const v = optionalText(body.altText, ASSET_ALT_MAX, "Texte alternatif");
    if (v && typeof v === "object") return NextResponse.json(v, { status: 400 });
    data.altText = v;
  }
  if (body.tags !== undefined) {
    const v = normalizeTags(body.tags);
    if (!Array.isArray(v)) return NextResponse.json(v, { status: 400 });
    data.tags = v;
  }

  const asset = await prisma.userAsset.update({ where: { id: existing.id }, data, select: ASSET_SELECT });
  return NextResponse.json({ asset });
}

/** DELETE /api/assets/[id]?force=1 */
export async function deleteAsset(req: Request, id: string) {
  const auth = await requirePermission("assets:manage");
  if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const asset = await ownedAsset(id, auth.userId);
  if (!asset) return NextResponse.json({ error: "Média introuvable" }, { status: 404 });

  const force = new URL(req.url).searchParams.get("force") === "1";
  const outcome = await deleteOwnedAsset(asset, await getManagedUserIdsForViewer(auth.userId), force);

  if (outcome.status === "deleted") return NextResponse.json({ success: true });
  if (outcome.status === "used_elsewhere") {
    return NextResponse.json(
      { error: "Ce média est utilisé dans un compte que vous ne gérez pas : suppression impossible.", usages: outcome.usages },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { error: "Ce média est utilisé. Confirmez pour le retirer de ces emplacements et le supprimer.", usages: outcome.usages },
    { status: 409 },
  );
}
