import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { parseSafeUrl, SAFE_URL_MAX_LENGTH } from "@/lib/safe-url";
import { NextResponse } from "next/server";

export const HOTSPOT_TYPES = ["INFO", "PROJECT", "VIDEO", "CTA", "NAVIGATION", "LINK"] as const;
type HotspotType = (typeof HOTSPOT_TYPES)[number];

/** Types qui n’ont de sens qu’avec un lien. */
const TYPES_REQUIRING_URL: HotspotType[] = ["LINK", "CTA", "VIDEO"];
const LABEL_MAX = 120;
const DESCRIPTION_MAX = 500;

type HotspotState = {
  label: string;
  type: HotspotType;
  yaw: number;
  pitch: number;
  targetUrl: string | null;
  targetSceneId: string | null;
  description: string | null;
};

type Fail = { ok: false; error: string };

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Lit les champs présents dans le corps (tous optionnels ici ; l’état final est validé ensuite). */
function readPatch(body: Record<string, unknown>): { ok: true; patch: Partial<HotspotState> } | Fail {
  const patch: Partial<HotspotState> = {};

  if (body.label !== undefined) {
    if (typeof body.label !== "string") return { ok: false, error: "label invalide" };
    patch.label = body.label.trim();
  }
  if (body.type !== undefined) {
    if (!HOTSPOT_TYPES.includes(body.type as HotspotType)) return { ok: false, error: "type invalide" };
    patch.type = body.type as HotspotType;
  }
  for (const key of ["yaw", "pitch"] as const) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "number" || !Number.isFinite(body[key])) {
        return { ok: false, error: `${key} doit être un nombre` };
      }
      patch[key] = key === "yaw" ? clamp(body[key], -180, 180) : clamp(body[key], -90, 90);
    }
  }
  if (body.targetUrl !== undefined) {
    if (body.targetUrl === null || body.targetUrl === "") {
      patch.targetUrl = null;
    } else {
      const safe = parseSafeUrl(body.targetUrl);
      if (!safe) {
        return {
          ok: false,
          error: `Lien refusé : utilisez une adresse https://, mailto:, tel: ou un chemin interne /… (max ${SAFE_URL_MAX_LENGTH} caractères).`,
        };
      }
      patch.targetUrl = safe.href;
    }
  }
  if (body.targetSceneId !== undefined) {
    if (body.targetSceneId !== null && typeof body.targetSceneId !== "string") {
      return { ok: false, error: "targetSceneId invalide" };
    }
    patch.targetSceneId = body.targetSceneId || null;
  }
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      return { ok: false, error: "description invalide" };
    }
    const text = typeof body.description === "string" ? body.description.trim() : "";
    if (text.length > DESCRIPTION_MAX) return { ok: false, error: `Description trop longue (max ${DESCRIPTION_MAX})` };
    patch.description = text || null;
  }
  return { ok: true, patch };
}

/** Règles sur l’état complet (création comme modification). */
async function validateState(state: HotspotState, spaceId: string, sceneId: string): Promise<Fail | null> {
  if (!state.label || state.label.length > LABEL_MAX) {
    return { ok: false, error: `label requis (1 à ${LABEL_MAX} caractères)` };
  }
  if (TYPES_REQUIRING_URL.includes(state.type) && !state.targetUrl) {
    return { ok: false, error: `Un hotspot ${state.type} nécessite un lien (targetUrl).` };
  }
  if (state.type === "INFO" && state.targetUrl) {
    return { ok: false, error: "Un hotspot INFO affiche un texte : utilisez LINK pour un lien." };
  }
  if (state.type === "NAVIGATION" && !state.targetSceneId) {
    return { ok: false, error: "Un hotspot NAVIGATION nécessite une scène cible (targetSceneId)." };
  }
  if (state.targetSceneId) {
    if (state.targetSceneId === sceneId) return { ok: false, error: "La scène cible doit être une autre scène." };
    // La scène cible doit appartenir au MÊME Space (pas de lien vers l’espace d’un autre utilisateur).
    const target = await prisma.smartSpaceScene.findFirst({
      where: { id: state.targetSceneId, spaceId },
      select: { id: true },
    });
    if (!target) return { ok: false, error: "Scène cible introuvable dans ce Space." };
  }
  return null;
}

function toRow(state: HotspotState) {
  return {
    label: state.label,
    type: state.type,
    yaw: state.yaw,
    pitch: state.pitch,
    targetUrl: state.targetUrl,
    targetSceneId: state.targetSceneId,
    metadata: state.description ? { description: state.description } : undefined,
  };
}

function descriptionOf(metadata: unknown): string | null {
  if (metadata && typeof metadata === "object" && "description" in metadata) {
    const d = (metadata as { description: unknown }).description;
    return typeof d === "string" ? d : null;
  }
  return null;
}

async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  const body = await req.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
}

/** POST /api/spaces/[id]/hotspots */
export async function createHotspot(req: Request, spaceId: string) {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return fail("Unauthorized", 401);

  const space = await prisma.smartSpace.findFirst({
    where: { id: spaceId, userId: auth.userId },
    include: { scenes: { orderBy: { sortOrder: "asc" }, select: { id: true } } },
  });
  if (!space || space.scenes.length === 0) return fail("Space not found", 404);

  const body = await readJson(req);
  if (!body) return fail("Corps JSON invalide");

  let sceneId = space.scenes[0].id;
  if (body.sceneId !== undefined) {
    if (typeof body.sceneId !== "string" || !space.scenes.some((s) => s.id === body.sceneId)) {
      return fail("Scène introuvable dans ce Space.");
    }
    sceneId = body.sceneId;
  }

  const read = readPatch(body);
  if (!read.ok) return fail(read.error);
  if (read.patch.yaw === undefined || read.patch.pitch === undefined) return fail("yaw et pitch sont requis");

  const state: HotspotState = {
    label: read.patch.label ?? "",
    type: read.patch.type ?? "INFO",
    yaw: read.patch.yaw,
    pitch: read.patch.pitch,
    targetUrl: read.patch.targetUrl ?? null,
    targetSceneId: read.patch.targetSceneId ?? null,
    description: read.patch.description ?? null,
  };
  const invalid = await validateState(state, spaceId, sceneId);
  if (invalid) return fail(invalid.error);

  const hotspot = await prisma.smartSpaceHotspot.create({ data: { sceneId, ...toRow(state) } });
  return NextResponse.json({ hotspot }, { status: 201 });
}

async function findOwnedHotspot(spaceId: string, hotspotId: string, userId: string) {
  return prisma.smartSpaceHotspot.findFirst({
    where: { id: hotspotId, scene: { spaceId, space: { userId } } },
  });
}

/** PATCH /api/spaces/[id]/hotspots/[hotspotId] */
export async function updateHotspot(req: Request, spaceId: string, hotspotId: string) {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return fail("Unauthorized", 401);

  const existing = await findOwnedHotspot(spaceId, hotspotId, auth.userId);
  if (!existing) return fail("Hotspot not found", 404);

  const body = await readJson(req);
  if (!body) return fail("Corps JSON invalide");
  const read = readPatch(body);
  if (!read.ok) return fail(read.error);

  const state: HotspotState = {
    label: existing.label,
    type: HOTSPOT_TYPES.includes(existing.type as HotspotType) ? (existing.type as HotspotType) : "INFO",
    yaw: existing.yaw,
    pitch: existing.pitch,
    targetUrl: existing.targetUrl,
    targetSceneId: existing.targetSceneId,
    description: descriptionOf(existing.metadata),
    ...read.patch,
  };
  const invalid = await validateState(state, spaceId, existing.sceneId);
  if (invalid) return fail(invalid.error);

  const row = toRow(state);
  const hotspot = await prisma.smartSpaceHotspot.update({
    where: { id: existing.id },
    data: { ...row, metadata: state.description ? { description: state.description } : {} },
  });
  return NextResponse.json({ hotspot });
}

/** DELETE /api/spaces/[id]/hotspots/[hotspotId] */
export async function deleteHotspot(_req: Request, spaceId: string, hotspotId: string) {
  const auth = await requirePermission("spaces:manage");
  if (!auth) return fail("Unauthorized", 401);

  const existing = await findOwnedHotspot(spaceId, hotspotId, auth.userId);
  if (!existing) return fail("Hotspot not found", 404);

  await prisma.smartSpaceHotspot.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}
