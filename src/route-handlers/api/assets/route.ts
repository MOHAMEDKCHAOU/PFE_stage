import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getManagedUserIdsForViewer } from "@/lib/studio-access";
import { ASSET_SELECT } from "@/lib/user-assets";
import type { Prisma, UserAssetKind } from "@/generated/prisma";
import { deleteOwnedAsset, type PublicUsage } from "./shared";
import { NextResponse } from "next/server";

const DEFAULT_PAGE = 24;
const MAX_PAGE = 60;
const MAX_BULK = 100;

function parseKindFilter(raw: string | null): UserAssetKind[] | null {
  if (!raw || raw === "all") return null;
  const k = raw.toLowerCase();
  if (k === "image" || k === "images") return ["IMAGE"];
  if (k === "video" || k === "videos") return ["VIDEO"];
  if (k === "3d" || k === "model" || k === "models") return ["MODEL_3D"];
  return null;
}

/** Tri stable : l’id départage les égalités (pagination par curseur fiable). */
function orderFor(sort: string | null): Prisma.UserAssetOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "name":
      return [{ originalName: { sort: "asc", nulls: "last" } }, { id: "asc" }];
    case "size":
      return [{ sizeBytes: "desc" }, { id: "desc" }];
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

export function parseLimit(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return DEFAULT_PAGE;
  return Math.min(MAX_PAGE, Math.max(1, n));
}

/** GET /api/assets?kind=all|image|video|3d&q=&sort=recent|oldest|name|size&cursor=&limit= */
export async function GET(req: Request) {
  try {
    const auth = await requirePermission("assets:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

    const { searchParams } = new URL(req.url);
    const kinds = parseKindFilter(searchParams.get("kind"));
    const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
    const cursor = searchParams.get("cursor");
    const take = parseLimit(searchParams.get("limit"));

    const where: Prisma.UserAssetWhereInput = {
      userId,
      ...(kinds ? { kind: { in: kinds } } : {}),
      ...(q
        ? {
            OR: [
              { originalName: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
              { altText: { contains: q, mode: "insensitive" } },
              { tags: { has: q.toLowerCase() } },
            ],
          }
        : {}),
    };

    const [items, stats] = await Promise.all([
      prisma.userAsset.findMany({
        where,
        orderBy: orderFor(searchParams.get("sort")),
        take: take + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: ASSET_SELECT,
      }),
      prisma.userAsset.aggregate({ where: { userId }, _count: { _all: true }, _sum: { sizeBytes: true } }),
    ]);

    const hasMore = items.length > take;
    const page = hasMore ? items.slice(0, take) : items;

    return NextResponse.json({
      items: page,
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
      stats: { count: stats._count._all, bytes: stats._sum.sizeBytes ?? 0 },
    });
  } catch (e) {
    console.error("GET /api/assets", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** DELETE /api/assets { ids: string[], force?: boolean } — suppression groupée */
export async function DELETE(req: Request) {
  try {
    const auth = await requirePermission("assets:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const body = (await req.json().catch(() => null)) as { ids?: unknown; force?: unknown } | null;
    const ids = Array.isArray(body?.ids) ? body!.ids.filter((id): id is string => typeof id === "string") : [];
    if (ids.length === 0 || ids.length > MAX_BULK) {
      return NextResponse.json({ error: `ids requis (1 à ${MAX_BULK})` }, { status: 400 });
    }

    // Filtré sur userId : impossible de supprimer le média d’un autre compte.
    const assets = await prisma.userAsset.findMany({
      where: { id: { in: ids }, userId: auth.userId },
      select: { id: true, url: true },
    });
    const managedIds = await getManagedUserIdsForViewer(auth.userId);

    const deleted: string[] = [];
    const blocked: Array<{ id: string; reason: "IN_USE" | "USED_ELSEWHERE"; usages: PublicUsage[] }> = [];
    for (const asset of assets) {
      const outcome = await deleteOwnedAsset(asset, managedIds, body?.force === true);
      if (outcome.status === "deleted") deleted.push(asset.id);
      else blocked.push({ id: asset.id, reason: outcome.status === "in_use" ? "IN_USE" : "USED_ELSEWHERE", usages: outcome.usages });
    }

    return NextResponse.json({ deleted, blocked, notFound: ids.length - assets.length });
  } catch (e) {
    console.error("DELETE /api/assets", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
