import { prisma } from "@/lib/prisma";
import { deleteUploadFile } from "@/lib/asset-storage";
import { detachAssetUsages, findAssetUsages, type AssetUsage } from "@/lib/asset-usage";

export type PublicUsage = { type: AssetUsage["type"]; label: string; href: string | null; external: boolean };

/** Les usages dans des comptes non gérés par le visiteur restent anonymes. */
export function toPublicUsages(usages: AssetUsage[], managedIds: string[]): PublicUsage[] {
  return usages.map((u) =>
    managedIds.includes(u.ownerUserId)
      ? { type: u.type, label: u.label, href: u.href, external: false }
      : { type: u.type, label: "Utilisé dans un autre compte", href: null, external: true },
  );
}

export type DeleteOutcome =
  | { status: "deleted" }
  | { status: "in_use"; usages: PublicUsage[] }
  | { status: "used_elsewhere"; usages: PublicUsage[] };

/**
 * Supprime un média appartenant à l’utilisateur.
 * - utilisé uniquement dans des comptes gérés : refus sauf `force` (références alors retirées) ;
 * - utilisé dans un autre compte : toujours refusé (on ne casse pas l’espace d’autrui).
 */
export async function deleteOwnedAsset(
  asset: { id: string; url: string },
  managedIds: string[],
  force: boolean,
): Promise<DeleteOutcome> {
  const usages = await findAssetUsages(asset.url);
  const publicUsages = toPublicUsages(usages, managedIds);
  if (usages.some((u) => !managedIds.includes(u.ownerUserId))) {
    return { status: "used_elsewhere", usages: publicUsages };
  }
  if (usages.length > 0 && !force) return { status: "in_use", usages: publicUsages };

  if (usages.length > 0) await detachAssetUsages(asset.url, managedIds);
  await prisma.userAsset.delete({ where: { id: asset.id } });

  // Le fichier n’est retiré du disque que si plus aucune fiche ne le référence.
  const remaining = await prisma.userAsset.count({ where: { url: asset.url } });
  if (remaining === 0) await deleteUploadFile(asset.url);
  return { status: "deleted" };
}
