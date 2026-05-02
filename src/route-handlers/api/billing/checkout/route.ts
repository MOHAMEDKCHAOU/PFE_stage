import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, planToPriceIds } from "@/lib/stripe-server";
import type { SubscriptionPlanKey } from "@/lib/subscription-plans";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function appOrigin(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!base) return "http://localhost:3000";
  if (base.startsWith("http")) return base.replace(/\/$/, "");
  return `https://${base.replace(/\/$/, "")}`;
}

/** POST { plan: "PRO"|"STUDIO"|"STUDIO_PLUS", interval: "month"|"year" } */
export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Paiements non configurés (STRIPE_SECRET_KEY)." },
        { status: 503 },
      );
    }

    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

    let body: { plan?: unknown; interval?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
    }

    const planRaw = typeof body.plan === "string" ? body.plan.toUpperCase() : "";
    if (!(SUBSCRIPTION_PLANS as readonly string[]).includes(planRaw) || planRaw === "FREE") {
      return NextResponse.json({ error: "Plan invalide ou gratuit" }, { status: 400 });
    }
    const plan = planRaw as SubscriptionPlanKey;
    const interval = body.interval === "year" ? "year" : "month";
    const prices = planToPriceIds(plan);
    const priceId = interval === "year" ? prices.year : prices.month;
    if (!priceId) {
      return NextResponse.json(
        { error: "Identifiant de prix Stripe manquant pour ce plan. Vérifiez les variables d’environnement." },
        { status: 503 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, stripeCustomerId: true },
    });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const stripe = getStripe();
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = appOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/billing?checkout=success`,
      cancel_url: `${origin}/dashboard/billing?checkout=cancel`,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Impossible de créer la session Checkout" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("BILLING CHECKOUT", e);
    return NextResponse.json({ error: "Erreur lors de la création du paiement" }, { status: 500 });
  }
}
