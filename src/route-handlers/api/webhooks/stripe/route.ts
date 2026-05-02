import { getStripe } from "@/lib/stripe-server";
import {
  clearUserSubscription,
  findUserIdByStripeCustomer,
  findUserIdByStripeSubscription,
  syncUserFromStripeSubscription,
  updateUserStripeCustomer,
} from "@/lib/stripe-sync-user";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

/** Raw body requis pour la signature Stripe */
export const dynamic = "force-dynamic";

async function resolveUserIdFromSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const metaUid = sub.metadata?.userId;
  if (metaUid) return metaUid;
  const bySub = await findUserIdByStripeSubscription(sub.id);
  if (bySub) return bySub;
  const cid = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (cid) return findUserIdByStripeCustomer(cid);
  return null;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET manquant");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 503 });
  }

  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(buf, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subId = session.subscription;
        const customerId = session.customer;
        if (userId && typeof subId === "string" && typeof customerId === "string") {
          const sub = await getStripe().subscriptions.retrieve(subId);
          await syncUserFromStripeSubscription(userId, sub, customerId);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(sub);
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (userId && customerId) {
          await syncUserFromStripeSubscription(userId, sub, customerId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(sub);
        if (userId) await clearUserSubscription(userId);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const cid = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (cid) {
          const uid = await findUserIdByStripeCustomer(cid);
          if (uid) {
            await prisma.user.update({
              where: { id: uid },
              data: { subscriptionStatus: "past_due" },
            });
          }
        }
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const subRef = inv.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        const cid = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (subId && cid) {
          const sub = await getStripe().subscriptions.retrieve(subId);
          const userId = await resolveUserIdFromSubscription(sub);
          if (userId) await syncUserFromStripeSubscription(userId, sub, cid);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("WEBHOOK HANDLER", event.type, e);
    return NextResponse.json({ error: "Erreur traitement webhook" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
