import { isBillingDemoMode } from "@/lib/billing-demo-mode";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET — tarifs catalogue (base) + indicateur mode démo PFE. */
export async function GET() {
  try {
    const rows = await prisma.subscriptionPlanPrice.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({
      demoMode: isBillingDemoMode(),
      plans: rows.map((r) => ({
        planKey: r.planKey,
        name: r.name,
        description: r.description,
        monthlyCents: r.monthlyCents,
        yearlyCents: r.yearlyCents,
        currency: r.currency,
      })),
    });
  } catch (e) {
    console.error("GET /api/billing/plans", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
