import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function appOrigin(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!base) return "http://localhost:3000";
  if (base.startsWith("http")) return base.replace(/\/$/, "");
  return `https://${base.replace(/\/$/, "")}`;
}

/** POST — Portail client Stripe (carte, annulation, historique) */
export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Paiements non configurés." }, { status: 503 });
    }

    const auth = await requirePermission("billing:manage");
    const userId = auth?.userId ?? null;
    if (!userId) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun compte facturation associé. Souscrivez d’abord à un plan." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const origin = appOrigin();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("BILLING PORTAL", e);
    return NextResponse.json({ error: "Impossible d’ouvrir le portail de facturation" }, { status: 500 });
  }
}
