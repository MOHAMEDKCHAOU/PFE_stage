import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserAssetKind } from "@/generated/prisma";
import { NextResponse } from "next/server";

const PAGE = 24;

function parseKindFilter(raw: string | null): UserAssetKind[] | null {
  if (!raw || raw === "all") return null;
  const k = raw.toLowerCase();
  if (k === "image" || k === "images") return ["IMAGE"];
  if (k === "video" || k === "videos") return ["VIDEO"];
  if (k === "3d" || k === "model" || k === "models") return ["MODEL_3D"];
  return null;
}

// GET /api/assets?kind=all|image|video|3d&cursor=
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const kinds = parseKindFilter(searchParams.get("kind"));
    const cursor = searchParams.get("cursor");
    const take = Math.min(Number(searchParams.get("limit")) || PAGE, 48);

    const items = await prisma.userAsset.findMany({
      where: {
        userId,
        ...(kinds ? { kind: { in: kinds } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      select: {
        id: true,
        url: true,
        kind: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    let nextCursor: string | null = null;
    let slice = items;
    if (items.length > take) {
      nextCursor = items[take - 1]!.id;
      slice = items.slice(0, take);
    }

    return NextResponse.json({
      items: slice,
      nextCursor,
    });
  } catch (e) {
    console.error("GET /api/assets", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
