import { prisma } from "./prisma";
import { hasPermission } from "./rbac-policy";

async function viewerHasStudioAccess(viewerId: string): Promise<boolean> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true, status: true },
  });
  return Boolean(viewer && viewer.status === "ACTIVE" && hasPermission(viewer.role, "studio:access"));
}

/**
 * Own account + linked Studio clients, but only while the viewer still has the
 * studio:access permission. Downgrading an AFFILIATE therefore revokes delegated
 * client access immediately, even if old AffiliateClient rows still exist.
 */
export async function getManagedUserIdsForViewer(viewerId: string): Promise<string[]> {
  const links = await prisma.affiliateClient.findMany({
    where: { affiliateUserId: viewerId },
    select: { clientUserId: true },
  });
  if (links.length === 0) return [viewerId];
  if (!(await viewerHasStudioAccess(viewerId))) return [viewerId];
  return [viewerId, ...links.map((link) => link.clientUserId)];
}

export async function isAffiliateForClient(
  affiliateUserId: string,
  clientUserId: string,
): Promise<boolean> {
  if (affiliateUserId === clientUserId) return false;

  const row = await prisma.affiliateClient.findUnique({
    where: {
      affiliateUserId_clientUserId: { affiliateUserId, clientUserId },
    },
  });
  if (!row) return false;
  return viewerHasStudioAccess(affiliateUserId);
}

/** Propriétaire d’identité ou Studio autorisé à gérer ce client. */
export async function canManageIdentityAsOwner(
  viewerId: string,
  identityOwnerUserId: string,
): Promise<boolean> {
  if (viewerId === identityOwnerUserId) return true;
  return isAffiliateForClient(viewerId, identityOwnerUserId);
}
