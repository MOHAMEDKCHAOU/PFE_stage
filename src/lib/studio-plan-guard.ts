import { assertStudioSubscription, type QuotaError } from "@/lib/subscription-guards";
import { NextResponse } from "next/server";

export function subscriptionErrorResponse(q: QuotaError) {
  return NextResponse.json({ error: q.error }, { status: q.status });
}

/** À appeler après `requireAffiliate()` sur les routes Studio payantes. */
export async function requireStudioSubscriptionOrResponse(
  affiliateId: string | null,
): Promise<NextResponse | null> {
  if (!affiliateId) {
    return NextResponse.json({ error: "Réservé aux comptes Studio (affilié)" }, { status: 403 });
  }
  const q = await assertStudioSubscription(affiliateId);
  if (q) return subscriptionErrorResponse(q);
  return null;
}
