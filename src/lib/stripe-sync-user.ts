import { prisma } from "@/lib/prisma";
import { priceIdToPlan } from "@/lib/stripe-server";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from "@/lib/subscription-plans";
import type Stripe from "stripe";

function firstSubscriptionItemPriceId(sub: Stripe.Subscription): string | null {
  const item = sub.items.data[0];
  const p = item?.price?.id;
  return typeof p === "string" ? p : null;
}

function resolvePlan(sub: Stripe.Subscription, priceId: string | null): SubscriptionPlanKey {
  const map = priceIdToPlan();
  if (priceId && map[priceId]) return map[priceId];
  const meta = sub.metadata?.plan?.toUpperCase();
  if (meta && (SUBSCRIPTION_PLANS as readonly string[]).includes(meta)) {
    return meta as SubscriptionPlanKey;
  }
  return "FREE";
}

export async function syncUserFromStripeSubscription(
  userId: string,
  sub: Stripe.Subscription,
  customerId: string,
): Promise<void> {
  const priceId = firstSubscriptionItemPriceId(sub);
  const plan = resolvePlan(sub, priceId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      subscriptionPlan: plan,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
    },
  });
}

export async function clearUserSubscription(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: null,
      subscriptionStatus: "canceled",
      subscriptionPlan: "FREE",
      currentPeriodEnd: null,
    },
  });
}

export async function updateUserStripeCustomer(userId: string, customerId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customerId },
  });
}

export async function findUserIdByStripeCustomer(customerId: string): Promise<string | null> {
  const u = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return u?.id ?? null;
}

export async function findUserIdByStripeSubscription(subId: string): Promise<string | null> {
  const u = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subId },
    select: { id: true },
  });
  return u?.id ?? null;
}
