import Stripe from "stripe";
import type { SubscriptionPlanKey } from "@/lib/subscription-plans";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY manquant");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

/** Map des Price Stripe → plan interne (remplir les variables d’environnement). */
export function priceIdToPlan(): Record<string, SubscriptionPlanKey> {
  const m: Record<string, SubscriptionPlanKey> = {};
  const add = (env: string | undefined, plan: SubscriptionPlanKey) => {
    if (env) m[env] = plan;
  };
  add(process.env.STRIPE_PRICE_PRO_MONTHLY, "PRO");
  add(process.env.STRIPE_PRICE_PRO_YEARLY, "PRO");
  add(process.env.STRIPE_PRICE_STUDIO_MONTHLY, "STUDIO");
  add(process.env.STRIPE_PRICE_STUDIO_YEARLY, "STUDIO");
  add(process.env.STRIPE_PRICE_STUDIO_PLUS_MONTHLY, "STUDIO_PLUS");
  add(process.env.STRIPE_PRICE_STUDIO_PLUS_YEARLY, "STUDIO_PLUS");
  return m;
}

export function planToPriceIds(plan: SubscriptionPlanKey): { month?: string; year?: string } {
  switch (plan) {
    case "PRO":
      return { month: process.env.STRIPE_PRICE_PRO_MONTHLY, year: process.env.STRIPE_PRICE_PRO_YEARLY };
    case "STUDIO":
      return { month: process.env.STRIPE_PRICE_STUDIO_MONTHLY, year: process.env.STRIPE_PRICE_STUDIO_YEARLY };
    case "STUDIO_PLUS":
      return {
        month: process.env.STRIPE_PRICE_STUDIO_PLUS_MONTHLY,
        year: process.env.STRIPE_PRICE_STUDIO_PLUS_YEARLY,
      };
    default:
      return {};
  }
}
