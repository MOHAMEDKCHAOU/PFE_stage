import { getUserId } from "@/lib/auth";
import { isBillingDemoMode } from "@/lib/billing-demo-mode";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlanKey } from "@/lib/subscription-plans";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function addPeriod(end: Date, interval: "month" | "year"): void {
  if (interval === "year") {
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  } else {
    end.setUTCMonth(end.getUTCMonth() + 1);
  }
}

/** POST { plan: "PRO"|"STUDIO"|"STUDIO_PLUS", interval: "month"|"year" } — simulation abonnement (sans Stripe). */
export async function POST(req: Request) {
  try {
    if (!isBillingDemoMode()) {
      return NextResponse.json(
        { error: "Mode démo désactivé. Définissez BILLING_DEMO_MODE=true pour le PFE." },
        { status: 403 },
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

    const offer = await prisma.subscriptionPlanPrice.findUnique({ where: { planKey: plan } });
    if (!offer) {
      return NextResponse.json({ error: "Tarif inconnu en base" }, { status: 404 });
    }

    const currentPeriodEnd = new Date();
    addPeriod(currentPeriodEnd, interval);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        currentPeriodEnd,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Abonnement simulé enregistré (mode démo PFE, aucun paiement Stripe).",
      plan,
      interval,
    });
  } catch (e) {
    console.error("POST /api/billing/demo-activate", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
