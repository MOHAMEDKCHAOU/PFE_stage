import type { SubscriptionPlanKey } from "@/lib/subscription-plans";
import { prisma } from "@/lib/prisma";
import {
  canHidePlatformBranding,
  getLimitsForUser,
  utcPeriodKey,
  type BillingUserFields,
} from "@/lib/subscription-entitlements";

export async function loadBillingUser(userId: string): Promise<BillingUserFields | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      currentPeriodEnd: true,
    },
  });
}

export async function getIdentityCountForOwner(ownerUserId: string): Promise<number> {
  return prisma.identityProfile.count({ where: { userId: ownerUserId } });
}

export async function getCapsuleCountForOwner(ownerUserId: string): Promise<number> {
  return prisma.capsule.count({
    where: { identity: { userId: ownerUserId } },
  });
}

export async function getStudioClientCount(affiliateId: string): Promise<number> {
  return prisma.affiliateClient.count({ where: { affiliateUserId: affiliateId } });
}

export async function getStudioInvitesCreatedInPeriod(
  affiliateId: string,
  periodKey: string,
): Promise<number> {
  const [y, m] = periodKey.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  return prisma.studioClientInvite.count({
    where: {
      affiliateUserId: affiliateId,
      createdAt: { gte: start, lt: end },
    },
  });
}

export async function getUsageCounts(userId: string, periodKey = utcPeriodKey()) {
  const row = await prisma.subscriptionUsage.findUnique({
    where: { userId_periodKey: { userId, periodKey } },
  });
  return {
    periodKey,
    exportsCount: row?.exportsCount ?? 0,
    invitesCount: row?.invitesCount ?? 0,
  };
}

export async function incrementExportUsage(userId: string): Promise<void> {
  const periodKey = utcPeriodKey();
  await prisma.subscriptionUsage.upsert({
    where: { userId_periodKey: { userId, periodKey } },
    create: { userId, periodKey, exportsCount: 1 },
    update: { exportsCount: { increment: 1 } },
  });
}

export async function incrementInviteUsage(userId: string): Promise<void> {
  const periodKey = utcPeriodKey();
  await prisma.subscriptionUsage.upsert({
    where: { userId_periodKey: { userId, periodKey } },
    create: { userId, periodKey, invitesCount: 1 },
    update: { invitesCount: { increment: 1 } },
  });
}

export type QuotaError = { status: number; error: string };

export async function assertCanCreateIdentity(_actorUserId: string, ownerUserId: string): Promise<QuotaError | null> {
  const billing = await loadBillingUser(ownerUserId);
  if (!billing) return { status: 404, error: "Utilisateur introuvable" };
  const { limits, plan } = getLimitsForUser(billing);
  const n = await getIdentityCountForOwner(ownerUserId);
  if (n >= limits.maxIdentities) {
    return {
      status: 403,
      error: `Limite d’identités atteinte pour le plan ${plan} (${limits.maxIdentities}).`,
    };
  }
  return null;
}

export async function assertCanCreateCapsule(_actorUserId: string, ownerUserId: string): Promise<QuotaError | null> {
  const billing = await loadBillingUser(ownerUserId);
  if (!billing) return { status: 404, error: "Utilisateur introuvable" };
  const { limits, plan } = getLimitsForUser(billing);
  const n = await getCapsuleCountForOwner(ownerUserId);
  if (n >= limits.maxCapsules) {
    return {
      status: 403,
      error: `Limite de capsules atteinte pour le plan ${plan} (${limits.maxCapsules}).`,
    };
  }
  return null;
}

export async function assertStudioSubscription(affiliateId: string): Promise<QuotaError | null> {
  const billing = await loadBillingUser(affiliateId);
  if (!billing) return { status: 401, error: "Non autorisé" };
  const { limits } = getLimitsForUser(billing);
  if (!limits.studioFeatureAccess) {
    return {
      status: 403,
      error:
        "Abonnement Commercial ou Commercial+ requis. Ouvrez Facturation pour souscrire ou mettre à niveau votre offre.",
    };
  }
  return null;
}

export async function assertCanAddStudioClient(affiliateId: string): Promise<QuotaError | null> {
  const base = await assertStudioSubscription(affiliateId);
  if (base) return base;
  const billing = (await loadBillingUser(affiliateId))!;
  const { limits, plan } = getLimitsForUser(billing);
  const n = await getStudioClientCount(affiliateId);
  if (n >= limits.maxStudioClients) {
    return {
      status: 403,
      error: `Limite de clients liés atteinte (${limits.maxStudioClients}, plan ${plan}).`,
    };
  }
  return null;
}

export async function assertCanCreateStudioInvite(affiliateId: string): Promise<QuotaError | null> {
  const base = await assertStudioSubscription(affiliateId);
  if (base) return base;
  const billing = (await loadBillingUser(affiliateId))!;
  const { limits, plan } = getLimitsForUser(billing);
  const periodKey = utcPeriodKey();
  const createdInMonth = await getStudioInvitesCreatedInPeriod(affiliateId, periodKey);
  if (createdInMonth >= limits.maxStudioInvitesPerMonth) {
    return {
      status: 403,
      error: `Quota mensuel d’invitations atteint (${limits.maxStudioInvitesPerMonth}, plan ${plan}).`,
    };
  }
  return null;
}

export async function assertCanStudioExport(affiliateId: string): Promise<QuotaError | null> {
  const base = await assertStudioSubscription(affiliateId);
  if (base) return base;
  const billing = (await loadBillingUser(affiliateId))!;
  const { limits, plan } = getLimitsForUser(billing);
  const periodKey = utcPeriodKey();
  const usage = await getUsageCounts(affiliateId, periodKey);
  if (usage.exportsCount >= limits.maxStudioExportsPerMonth) {
    return {
      status: 403,
      error: `Quota mensuel d’exports (espace commercial) atteint (${limits.maxStudioExportsPerMonth}, plan ${plan}).`,
    };
  }
  return null;
}

function parseDeclaredPlan(raw: string): SubscriptionPlanKey {
  const u = raw.toUpperCase();
  return (["FREE", "PRO", "STUDIO", "STUDIO_PLUS"] as const).includes(u as SubscriptionPlanKey)
    ? (u as SubscriptionPlanKey)
    : "FREE";
}

export async function getBillingSnapshotForUser(userId: string) {
  const billing = await loadBillingUser(userId);
  if (!billing) return null;
  const { limits, plan } = getLimitsForUser(billing);
  const periodKey = utcPeriodKey();
  const usage = await getUsageCounts(userId, periodKey);
  const identities = await getIdentityCountForOwner(userId);
  const capsules = await getCapsuleCountForOwner(userId);
  let studioClients = 0;
  let invitesMonth = 0;
  if (billing.role === "AFFILIATE") {
    studioClients = await getStudioClientCount(userId);
    invitesMonth = await getStudioInvitesCreatedInPeriod(userId, periodKey);
  }

  return {
    effectivePlan: plan,
    declaredPlan: parseDeclaredPlan(billing.subscriptionPlan),
    subscriptionStatus: billing.subscriptionStatus,
    currentPeriodEnd: billing.currentPeriodEnd?.toISOString() ?? null,
    hasStripeCustomer: !!billing.stripeCustomerId,
    /** Masquer le branding Faymoos sur les capsules publiques (Pro / Commercial / Commercial+ ou admin). */
    canHideBranding: canHidePlatformBranding(billing),
    limits,
    usage: {
      periodKey,
      identities,
      capsules,
      studioClients,
      studioInvitesThisMonth: invitesMonth,
      studioExportsThisMonth: usage.exportsCount,
    },
  };
}
