import type { SubscriptionPlanKey } from "@/lib/subscription-plans";
import { ACTIVE_SUBSCRIPTION_STATUSES, PLAN_LIMITS, SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export function utcPeriodKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function grandfatherAffiliatesEnabled(): boolean {
  return process.env.BILLING_GRANDFATHER_AFFILIATES !== "false";
}

function parsePlan(raw: string | null | undefined): SubscriptionPlanKey {
  if (!raw) return "FREE";
  const u = raw.toUpperCase();
  return (SUBSCRIPTION_PLANS as readonly string[]).includes(u) ? (u as SubscriptionPlanKey) : "FREE";
}

export type BillingUserFields = {
  id: string;
  role: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionPlan: string;
  currentPeriodEnd: Date | null;
};

/**
 * Plan effectif pour les quotas (hors ADMIN).
 * Legacy : affiliés sans abonnement Stripe peuvent rester « Studio » si BILLING_GRANDFATHER_AFFILIATES.
 */
export function getEffectivePlan(user: BillingUserFields): SubscriptionPlanKey {
  if (user.role === "ADMIN") return "STUDIO_PLUS";

  const declared = parsePlan(user.subscriptionPlan);
  const active =
    user.subscriptionStatus != null && ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus.toLowerCase());

  if (active) return declared;

  if (
    grandfatherAffiliatesEnabled() &&
    user.role === "AFFILIATE" &&
    !user.stripeSubscriptionId &&
    declared === "FREE"
  ) {
    return "STUDIO";
  }

  return "FREE";
}

export function getLimitsForUser(user: BillingUserFields) {
  const key = getEffectivePlan(user);
  return { plan: key, limits: PLAN_LIMITS[key] };
}

export function isPaidSubscriptionActive(user: BillingUserFields): boolean {
  if (user.role === "ADMIN") return true;
  return (
    user.subscriptionStatus != null && ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus.toLowerCase())
  );
}

/**
 * White-label capsule publique : réservé aux plans payants (plan effectif ≠ FREE),
 * ou administrateurs. Aligné sur {@link getEffectivePlan} (abonnement actif, grandfather Studio, etc.).
 */
export function canHidePlatformBranding(user: BillingUserFields): boolean {
  if (user.role === "ADMIN") return true;
  return getEffectivePlan(user) !== "FREE";
}

/** Valeur réelle pour les visiteurs : préférence stockée × éligibilité actuelle du propriétaire. */
export function resolvePublicHideBranding(storedPreference: boolean, owner: BillingUserFields): boolean {
  return storedPreference && canHidePlatformBranding(owner);
}
