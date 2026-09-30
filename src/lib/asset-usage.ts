import { prisma } from "@/lib/prisma";

/**
 * Où un média (URL /uploads/…) est-il utilisé ? Sert à prévenir avant suppression et à
 * retirer proprement les références lors d’une suppression forcée.
 */
export type AssetUsage = {
  type: "AVATAR" | "COVER" | "PORTFOLIO" | "PARTNER_LOGO" | "SPACE_COVER" | "CAPSULE";
  label: string;
  /** Propriétaire de l’élément qui référence le média */
  ownerUserId: string;
  href: string;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function findAssetUsages(url: string): Promise<AssetUsage[]> {
  const [identities, projects, partners, spaces, capsules] = await Promise.all([
    prisma.identityProfile.findMany({
      where: { OR: [{ avatar: url }, { cover: url }] },
      select: { name: true, avatar: true, cover: true, userId: true },
    }),
    prisma.portfolioProject.findMany({
      where: { image: url },
      select: { title: true, identity: { select: { name: true, userId: true } } },
    }),
    prisma.studioPartnerProfile.findMany({
      where: { logoUrl: url },
      select: { agencyName: true, affiliateUserId: true },
    }),
    prisma.smartSpace.findMany({ where: { coverUrl: url }, select: { title: true, userId: true } }),
    prisma.$queryRaw<Array<{ title: string; userId: string }>>`
      SELECT c."title", i."userId"
      FROM "Capsule" c JOIN "IdentityProfile" i ON i."id" = c."identityId"
      WHERE c."editorHotspots"::text LIKE ${"%" + escapeLike(url) + "%"}
      LIMIT 50`,
  ]);

  const usages: AssetUsage[] = [];
  for (const i of identities) {
    if (i.avatar === url) usages.push({ type: "AVATAR", label: `Photo de profil · ${i.name}`, ownerUserId: i.userId, href: "/dashboard/identities" });
    if (i.cover === url) usages.push({ type: "COVER", label: `Couverture · ${i.name}`, ownerUserId: i.userId, href: "/dashboard/identities" });
  }
  for (const p of projects) {
    usages.push({ type: "PORTFOLIO", label: `Portfolio · ${p.title} (${p.identity.name})`, ownerUserId: p.identity.userId, href: "/dashboard/identities" });
  }
  for (const p of partners) {
    usages.push({ type: "PARTNER_LOGO", label: `Logo QR partenaire${p.agencyName ? ` · ${p.agencyName}` : ""}`, ownerUserId: p.affiliateUserId, href: "/dashboard/studio" });
  }
  for (const s of spaces) {
    usages.push({ type: "SPACE_COVER", label: `Smart Space · ${s.title}`, ownerUserId: s.userId, href: "/dashboard/spaces" });
  }
  for (const c of capsules) {
    usages.push({ type: "CAPSULE", label: `Capsule · ${c.title}`, ownerUserId: c.userId, href: "/dashboard/capsules" });
  }
  return usages;
}

/** Retire le média des emplacements appartenant aux comptes indiqués (suppression forcée). */
export async function detachAssetUsages(url: string, ownerUserIds: string[]): Promise<void> {
  await prisma.$transaction([
    prisma.identityProfile.updateMany({ where: { avatar: url, userId: { in: ownerUserIds } }, data: { avatar: null } }),
    prisma.identityProfile.updateMany({ where: { cover: url, userId: { in: ownerUserIds } }, data: { cover: null } }),
    prisma.portfolioProject.updateMany({ where: { image: url, identity: { userId: { in: ownerUserIds } } }, data: { image: null } }),
    prisma.studioPartnerProfile.updateMany({ where: { logoUrl: url, affiliateUserId: { in: ownerUserIds } }, data: { logoUrl: null } }),
    prisma.smartSpace.updateMany({ where: { coverUrl: url, userId: { in: ownerUserIds } }, data: { coverUrl: null } }),
  ]);
}
