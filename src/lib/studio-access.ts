import { prisma } from "./prisma";

/** Propriétaire + comptes clients liés (vue Studio affilié). */
export async function getManagedUserIdsForViewer(viewerId: string): Promise<string[]> {
  const links = await prisma.affiliateClient.findMany({
    where: { affiliateUserId: viewerId },
    select: { clientUserId: true },
  });
  return [viewerId, ...links.map((l) => l.clientUserId)];
}

export async function isAffiliateForClient(affiliateUserId: string, clientUserId: string): Promise<boolean> {
  if (affiliateUserId === clientUserId) return false;
  const row = await prisma.affiliateClient.findUnique({
    where: {
      affiliateUserId_clientUserId: { affiliateUserId, clientUserId },
    },
  });
  return !!row;
}

/** Propriétaire d’identité ou affilié gérant ce client. */
export async function canManageIdentityAsOwner(viewerId: string, identityOwnerUserId: string): Promise<boolean> {
  if (viewerId === identityOwnerUserId) return true;
  return isAffiliateForClient(viewerId, identityOwnerUserId);
}
