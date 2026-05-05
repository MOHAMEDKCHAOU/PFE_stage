import { prisma } from "@/lib/prisma";
import { parseTagsFromJson } from "@/lib/identity-profession";

/** Recent window for popularity (sessions) */
const POPULARITY_DAYS = 14;

const WEIGHT_SIMILARITY = 0.35;
const WEIGHT_POPULARITY = 0.3;
const WEIGHT_COLLABORATIVE = 0.35;

const WEIGHT_GUEST_POPULARITY = 0.55;
const WEIGHT_GUEST_DIVERSITY = 0.45;

/** Opaque: common FR/EN stopwords to reduce noise in cheap text overlap */
const STOP = new Set(
  "le la les un une des de du et au aux pour avec sans dans sur par est sont était être a ai as avons avez ont the a an of to in is are was be this that at from and or as on"
    .split(/\s+/),
);

export type RecommendationMeta = {
  personalized: boolean;
  /** Short explainability lines for the UI (FR) */
  reasons: string[];
  score: number;
};

export type RecommendedExploreIdentity = Awaited<
  ReturnType<typeof fetchExploreIdentitySelect>
>[number] & { _recommendation?: RecommendationMeta };

async function fetchExploreIdentitySelect() {
  return prisma.identityProfile.findMany({
    where: { capsules: { some: {} } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      profession: true,
      tags: true,
      headline: true,
      bio: true,
      avatar: true,
      cover: true,
      theme: true,
      _count: {
        select: {
          capsules: true,
          portfolioProjects: true,
          testimonials: true,
        },
      },
      capsules: {
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, objective: true },
      },
    },
  });
}

function tokenize(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  const words = text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûç0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  return new Set(words);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter++;
  }
  return inter / (a.size + b.size - inter);
}

function logPopularity(count: number, max: number): number {
  if (count <= 0) return 0;
  if (max <= 0) return 0;
  return Math.log1p(count) / Math.log1p(max);
}

/**
 * Reorder to avoid more than 2 identical `type` in a row (diversity in the list).
 */
function diversifyByType<T extends { type: string }>(ordered: T[]): T[] {
  if (ordered.length <= 1) return ordered;
  const out: T[] = [];
  const rest = [...ordered];

  const canAdd = (next: T) => {
    if (out.length < 2) return true;
    const t = next.type;
    return !(out[out.length - 1]!.type === t && out[out.length - 2]!.type === t);
  };

  while (rest.length) {
    const idx = rest.findIndex((x) => canAdd(x));
    const pick = idx >= 0 ? rest.splice(idx, 1)[0]! : rest.shift()!;
    out.push(pick);
  }
  return out;
}

function reasonsFor(
  personalized: boolean,
  sSim: number,
  sPop: number,
  sCol: number,
  typeMatch: boolean,
): string[] {
  const r: string[] = [];
  if (!personalized) {
    r.push("Tendances et diversité de profils");
    if (sPop > 0.5) r.push("Fort engagement récent");
    return r;
  }
  if (typeMatch) r.push("Profil du même type que vos centres d’intérêt");
  if (sSim > 0.2) r.push("Contenu proche de vos recherches passées");
  if (sCol > 0.15) r.push("Aimé par des personnes aux goûts proches des vôtres");
  if (sPop > 0.35) r.push("Bonne activité sur la plateforme");
  if (r.length === 0) r.push("Sélection personnalisée");
  return r.slice(0, 3);
}

/**
 * Hybrid recommendation: content (type + text), popularity (sessions), collaborative (favorites), diversity (reorder).
 * Guest: popularity + diversity; logged-in: full mix + own identities excluded.
 */
export async function getRecommendedIdentities(options: {
  userId: string | null;
  limit: number;
}): Promise<RecommendedExploreIdentity[]> {
  const { userId, limit: rawLimit } = options;
  const limit = Math.min(50, Math.max(1, rawLimit));

  const since = new Date(Date.now() - POPULARITY_DAYS * 24 * 60 * 60 * 1000);

  const [allIdentities, sessionGroups, myIdentityIds, favData, userProfiles] = await Promise.all([
    fetchExploreIdentitySelect(),
    prisma.capsuleSession.groupBy({
      by: ["capsuleId"],
      where: { startedAt: { gte: since } },
      _count: { _all: true },
    }),
    userId
      ? prisma.identityProfile.findMany({ where: { userId }, select: { id: true } })
      : Promise.resolve([] as { id: string }[]),
    userId
      ? prisma.favorite.findMany({
          where: { userId },
          select: { capsuleId: true },
        })
      : Promise.resolve([] as { capsuleId: string }[]),
    userId
      ? prisma.identityProfile.findMany({
          where: { userId },
          select: { type: true, headline: true, bio: true, profession: true, tags: true },
        })
      : Promise.resolve(
          [] as { type: string; headline: string | null; bio: string | null; profession: string | null; tags: unknown }[],
        ),
  ]);

  const myIds = new Set(myIdentityIds.map((x) => x.id));
  const candidates = allIdentities.filter((id) => !myIds.has(id.id));
  if (candidates.length === 0) return [];

  const capsuleIdsForSessions = sessionGroups.map((g) => g.capsuleId);
  const capsuleRows =
    capsuleIdsForSessions.length > 0
      ? await prisma.capsule.findMany({
          where: { id: { in: capsuleIdsForSessions } },
          select: { id: true, identityId: true },
        })
      : [];

  const idToCount = new Map<string, number>();
  const capIdToIdent = new Map(capsuleRows.map((c) => [c.id, c.identityId]));
  for (const g of sessionGroups) {
    const identId = capIdToIdent.get(g.capsuleId);
    if (!identId) continue;
    idToCount.set(identId, (idToCount.get(identId) ?? 0) + g._count._all);
  }

  const maxPop = Math.max(1, ...[...idToCount.values()]);

  const favCapsuleIds = favData.map((f) => f.capsuleId);
  const myFav = new Set(favCapsuleIds);
  const favoriteTypes = new Set<string>();
  if (favCapsuleIds.length > 0) {
    const caps = await prisma.capsule.findMany({
      where: { id: { in: favCapsuleIds } },
      select: { identity: { select: { type: true } } },
    });
    for (const c of caps) favoriteTypes.add(c.identity.type);
  }
  for (const p of userProfiles) favoriteTypes.add(p.type);

  let userText = new Set<string>();
  for (const p of userProfiles) {
    tokenize(p.headline).forEach((w) => userText.add(w));
    tokenize(p.bio).forEach((w) => userText.add(w));
    tokenize(p.profession).forEach((w) => userText.add(w));
    tokenize(parseTagsFromJson(p.tags).join(" ")).forEach((w) => userText.add(w));
  }
  if (favCapsuleIds.length > 0) {
    const favCaps = await prisma.capsule.findMany({
      where: { id: { in: favCapsuleIds } },
      select: { title: true, objective: true },
    });
    for (const c of favCaps) {
      tokenize(c.title + " " + c.objective).forEach((w) => userText.add(w));
    }
  }

  const collaborative = new Map<string, number>();
  if (userId && myFav.size > 0) {
    const coUsers = await prisma.favorite.findMany({
      where: { capsuleId: { in: [...myFav] }, userId: { not: userId } },
      select: { userId: true },
    });
    const otherIds = [...new Set(coUsers.map((c) => c.userId))];
    if (otherIds.length > 0) {
      const theirFavs = await prisma.favorite.findMany({
        where: { userId: { in: otherIds }, capsuleId: { notIn: [...myFav] } },
        select: { capsuleId: true },
      });
      if (theirFavs.length > 0) {
        const capIds = [...new Set(theirFavs.map((t) => t.capsuleId))];
        const withIdent = await prisma.capsule.findMany({
          where: { id: { in: capIds } },
          select: { identityId: true },
        });
        for (const w of withIdent) {
          if (myIds.has(w.identityId)) continue;
          collaborative.set(w.identityId, (collaborative.get(w.identityId) ?? 0) + 1);
        }
      }
    }
  }
  const collabMax = Math.max(1, ...collaborative.values());

  type IdRow = Awaited<ReturnType<typeof fetchExploreIdentitySelect>>[number];
  const scored: {
    identity: IdRow;
    score: number;
    sSim: number;
    sPop: number;
    sCol: number;
    typeMatch: boolean;
  }[] = [];

  for (const row of candidates) {
    const tokensB = new Set([
      ...tokenize(row.headline),
      ...tokenize(row.bio),
      ...tokenize(row.profession),
      ...tokenize(parseTagsFromJson(row.tags).join(" ")),
    ]);
    const j = jaccard(userText, tokensB);
    const typeMatch = favoriteTypes.size > 0 && favoriteTypes.has(row.type);
    const sim = typeMatch ? 0.55 + 0.45 * j : 0.2 + 0.8 * j;

    const rawPop = idToCount.get(row.id) ?? 0;
    const sPop = logPopularity(rawPop, maxPop);
    const sCol = userId && myFav.size > 0 ? (collaborative.get(row.id) ?? 0) / collabMax : 0;

    let score: number;
    if (!userId) {
      score = WEIGHT_GUEST_POPULARITY * sPop + WEIGHT_GUEST_DIVERSITY * (0.4 + 0.6 * j);
    } else if (myFav.size === 0 && userProfiles.length === 0) {
      score = WEIGHT_GUEST_POPULARITY * sPop + (1 - WEIGHT_GUEST_POPULARITY) * sim * 0.5;
    } else {
      score =
        WEIGHT_SIMILARITY * sim +
        WEIGHT_POPULARITY * sPop +
        WEIGHT_COLLABORATIVE * sCol;
    }

    scored.push({ identity: row, score, sSim: sim, sPop, sCol, typeMatch });
  }

  const byScore = [...scored].sort((a, b) => b.score - a.score);
  const personalized = Boolean(userId && (userProfiles.length > 0 || myFav.size > 0));
  const diversified = diversifyByType(byScore.map((s) => s.identity));
  const limited = diversified.slice(0, limit);

  const withMeta: RecommendedExploreIdentity[] = limited.map((row) => {
    const source = byScore.find((x) => x.identity.id === row.id);
    return {
      ...row,
      _recommendation: {
        personalized,
        score: source?.score ?? 0,
        reasons: reasonsFor(
          personalized,
          source?.sSim ?? 0,
          source?.sPop ?? 0,
          source?.sCol ?? 0,
          source?.typeMatch ?? false,
        ),
      },
    };
  });

  return withMeta;
}
