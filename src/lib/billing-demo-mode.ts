/** Mode PFE / démo : activer les abonnements sans appeler Stripe. */
export function isBillingDemoMode(): boolean {
  if (process.env.BILLING_DEMO_MODE === "true") return true;
  /** En local (`next dev`), sans clé Stripe : même flux que le PFE pour éviter les 503. */
  if (process.env.NODE_ENV !== "production" && !String(process.env.STRIPE_SECRET_KEY ?? "").trim()) {
    return true;
  }
  return false;
}
