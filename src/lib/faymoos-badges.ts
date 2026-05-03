import { prisma } from "@/lib/prisma";
import type { BadgeCategory, BadgeDefinition, BadgeTier, UserBadge } from "@/generated/prisma";

export const BADGE_PREVIEW_MAX = 3;

const CATEGORY_ORDER: BadgeCategory[] = ["EXPERTISE", "CREDIBILITY", "IMPACT"];

function tierRank(t: BadgeTier): number {
  return t === "EXPERT" ? 2 : 1;
}

/** Définitions attendues (ids fixes si migration appliquée ; sinon upsert par slug). */
const CANONICAL_BADGES: Array<{
  id: string;
  slug: string;
  label: string;
  description: string;
  category: BadgeCategory;
  sortOrder: number;
}> = [
  {
    id: "bdef-expertise-profile",
    slug: "expertise_profile",
    label: "Profil soigné",
    description:
      "Headline, bio et photo présents — votre expertise est lisible immédiatement. Passez en Expert avec couverture + projet portfolio.",
    category: "EXPERTISE",
    sortOrder: 10,
  },
  {
    id: "bdef-credibility-links",
    slug: "credibility_presence",
    label: "Présence en ligne",
    description: "Liens professionnels (LinkedIn, GitHub, site…) rassurent les visiteurs.",
    category: "CREDIBILITY",
    sortOrder: 20,
  },
  {
    id: "bdef-credibility-verified",
    slug: "credibility_verified",
    label: "Identité vérifiée",
    description: "Badge délivré manuellement par l’équipe Faymoos après contrôle.",
    category: "CREDIBILITY",
    sortOrder: 5,
  },
  {
    id: "bdef-impact-active",
    slug: "impact_creator",
    label: "Créateur actif",
    description: "Capsules publiées et engagement visiteurs sur Faymoos.",
    category: "IMPACT",
    sortOrder: 30,
  },
];

export async function ensureBadgeDefinitions(): Promise<void> {
  for (const b of CANONICAL_BADGES) {
    await prisma.badgeDefinition.upsert({
      where: { slug: b.slug },
      create: {
        id: b.id,
        slug: b.slug,
        label: b.label,
        description: b.description,
        category: b.category,
        sortOrder: b.sortOrder,
      },
      update: {
        label: b.label,
        description: b.description,
        category: b.category,
        sortOrder: b.sortOrder,
      },
    });
  }
}

type SocialRecord = Record<string, string> | null;

function hasProSocialLinks(social: SocialRecord): boolean {
  if (!social || typeof social !== "object") return false;
  for (const [k, v] of Object.entries(social)) {
    const key = k.toLowerCase();
    if (!v || typeof v !== "string" || !v.trim()) continue;
    if (key.includes("linkedin") || key.includes("github") || key === "linkedin" || key === "github") {
      return true;
    }
  }
  return false;
}

export async function syncAutoBadgesForUser(userId: string): Promise<void> {
  await ensureBadgeDefinitions();

  const identities = await prisma.identityProfile.findMany({
    where: { userId },
    include: {
      portfolioProjects: { where: { isPublic: true }, select: { id: true } },
      capsules: {
        where: { isPublished: true },
        select: { id: true },
      },
    },
  });

  let expertiseVerified = false;
  let expertiseExpert = false;
  let expertiseEvidence = "";

  for (const idn of identities) {
    const hasBasic = Boolean(idn.headline?.trim() && idn.bio?.trim() && idn.avatar);
    const hasExpert =
      hasBasic && Boolean(idn.cover) && (idn.portfolioProjects?.length ?? 0) >= 1;
    if (hasBasic) {
      expertiseVerified = true;
      expertiseEvidence = "Profil complet (headline, bio, photo)";
    }
    if (hasExpert) {
      expertiseExpert = true;
      expertiseEvidence = `Profil renforcé — couverture + ${idn.portfolioProjects.length} projet(s) portfolio public(s)`;
    }
  }

  const credibilityPresence = identities.some((i) => hasProSocialLinks(i.socialLinks as SocialRecord));

  const publishedCapsuleIds = [...new Set(identities.flatMap((i) => i.capsules.map((c) => c.id)))];
  const publishedCount = publishedCapsuleIds.length;
  const sessionCount =
    publishedCapsuleIds.length === 0
      ? 0
      : await prisma.capsuleSession.count({
          where: { capsuleId: { in: publishedCapsuleIds } },
        });

  const impactVerified = publishedCount >= 1;
  const impactExpert = sessionCount >= 50 || publishedCount >= 3;
  let impactEvidence = "";
  if (impactExpert) {
    impactEvidence = `${publishedCount} capsule(s) publiée(s)${sessionCount > 0 ? ` · ${sessionCount} sessions` : ""}`;
  } else if (impactVerified) {
    impactEvidence = `${publishedCount} capsule(s) publiée(s) sur Faymoos`;
  }

  const defs = await prisma.badgeDefinition.findMany({
    where: { slug: { in: ["expertise_profile", "credibility_presence", "impact_creator"] } },
  });
  const bySlug = Object.fromEntries(defs.map((d) => [d.slug, d])) as Record<string, BadgeDefinition>;

  async function applyAuto(slug: string, tier: BadgeTier | null, evidence: string) {
    const def = bySlug[slug];
    if (!def) return;
    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: def.id } },
    });
    if (existing && existing.source !== "AUTO") return;

    if (tier === null) {
      await prisma.userBadge.deleteMany({
        where: { userId, badgeId: def.id, source: "AUTO" },
      });
      return;
    }
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: def.id } },
      create: {
        userId,
        badgeId: def.id,
        tier,
        source: "AUTO",
        evidence,
        verifiedAt: new Date(),
      },
      update: {
        tier,
        evidence,
        verifiedAt: new Date(),
        source: "AUTO",
      },
    });
  }

  if (!expertiseVerified) {
    await applyAuto("expertise_profile", null, "");
  } else {
    await applyAuto(
      "expertise_profile",
      expertiseExpert ? "EXPERT" : "VERIFIED",
      expertiseEvidence || "Profil vérifié",
    );
  }

  if (!credibilityPresence) {
    await applyAuto("credibility_presence", null, "");
  } else {
    await applyAuto(
      "credibility_presence",
      "VERIFIED",
      "Liens LinkedIn / GitHub ou équivalent détectés sur le profil",
    );
  }

  if (!impactVerified) {
    await applyAuto("impact_creator", null, "");
  } else {
    await applyAuto("impact_creator", impactExpert ? "EXPERT" : "VERIFIED", impactEvidence);
  }
}

export function profileCompletenessPoints(identities: Array<{ headline: string | null; bio: string | null; avatar: string | null; cover: string | null; socialLinks: unknown; portfolioProjects: { id: string }[] }>): number {
  let best = 0;
  for (const idn of identities) {
    let s = 0;
    if (idn.headline?.trim()) s += 10;
    if (idn.bio?.trim()) s += 10;
    if (idn.avatar) s += 10;
    if (idn.cover) s += 5;
    if (hasProSocialLinks(idn.socialLinks as SocialRecord)) s += 5;
    const n = idn.portfolioProjects?.length ?? 0;
    s += Math.min(n * 4, 12);
    best = Math.max(best, s);
  }
  return Math.min(best, 40);
}

export async function computeFaymoosScore(userId: string): Promise<{
  score: number;
  label: string;
  breakdown: { completeness: number; badges: number; activity: number };
}> {
  const identities = await prisma.identityProfile.findMany({
    where: { userId },
    include: {
      portfolioProjects: { where: { isPublic: true }, select: { id: true } },
      capsules: { where: { isPublished: true }, select: { id: true } },
    },
  });
  const completeness = profileCompletenessPoints(identities);

  const capsuleIds = [...new Set(identities.flatMap((i) => i.capsules.map((c) => c.id)))];
  const sessionCount =
    capsuleIds.length === 0
      ? 0
      : await prisma.capsuleSession.count({ where: { capsuleId: { in: capsuleIds } } });
  const activity = Math.min(Math.floor(sessionCount / 10), 15);

  const badgesRows = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
  });
  let badgePts = 0;
  for (const row of badgesRows) {
    badgePts += row.tier === "EXPERT" ? 15 : 8;
  }
  badgePts = Math.min(badgePts, 45);

  const score = Math.min(100, completeness + badgePts + activity);
  const label =
    score >= 70 ? "Profil expert" : score >= 40 ? "Profil fort" : "Profil en progression";

  return {
    score,
    label,
    breakdown: { completeness, badges: badgePts, activity },
  };
}

export type PublicBadgeDTO = {
  id: string;
  slug: string;
  label: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  verifiedAt: string;
  evidence: string | null;
};

export type PublicBadgeBundle = {
  score: number;
  scoreLabel: string;
  profileCompleteness: number;
  preview: PublicBadgeDTO[];
  all: PublicBadgeDTO[];
};

function sortBadgesForDisplay(
  rows: (UserBadge & { badge: BadgeDefinition })[],
): (UserBadge & { badge: BadgeDefinition })[] {
  const catIndex = (c: BadgeCategory) => CATEGORY_ORDER.indexOf(c);
  return [...rows].sort((a, b) => {
    const c = catIndex(a.badge.category) - catIndex(b.badge.category);
    if (c !== 0) return c;
    if (a.badge.sortOrder !== b.badge.sortOrder) return a.badge.sortOrder - b.badge.sortOrder;
    return tierRank(b.tier) - tierRank(a.tier);
  });
}

export async function getPublicBadgePayloadForUser(userId: string): Promise<PublicBadgeBundle> {
  await syncAutoBadgesForUser(userId);
  const [{ score, label }, rows] = await Promise.all([
    computeFaymoosScore(userId),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    }),
  ]);

  const identities = await prisma.identityProfile.findMany({
    where: { userId },
    include: {
      portfolioProjects: { where: { isPublic: true }, select: { id: true } },
    },
  });
  const profileCompleteness = profileCompletenessPoints(identities);

  const sorted = sortBadgesForDisplay(rows);
  const toDto = (ub: (typeof sorted)[0]): PublicBadgeDTO => ({
    id: ub.id,
    slug: ub.badge.slug,
    label: ub.badge.label,
    description: ub.badge.description,
    category: ub.badge.category,
    tier: ub.tier,
    verifiedAt: ub.verifiedAt.toISOString(),
    evidence: ub.evidence,
  });

  const all = sorted.map(toDto);
  return {
    score,
    scoreLabel: label,
    profileCompleteness,
    preview: all.slice(0, BADGE_PREVIEW_MAX),
    all,
  };
}
