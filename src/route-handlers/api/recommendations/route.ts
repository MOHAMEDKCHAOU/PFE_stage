import { getUserId } from "@/lib/auth";
import { getRecommendedIdentities } from "@/modules/recommendation/recommendation.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/recommendations?limit=12
 * Hybrid recommendations (content + popularity + collaborative + diversity).
 * Works for guests (popular + diversity) and logged-in users (full personalization, own profiles excluded).
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    const raw = req.nextUrl.searchParams.get("limit");
    const parsed = raw ? parseInt(raw, 10) : 12;
    const limit = Number.isFinite(parsed) ? Math.min(50, Math.max(1, parsed)) : 12;

    const data = await getRecommendedIdentities({ userId, limit });
    return NextResponse.json(data);
  } catch (e) {
    console.error("RECOMMENDATIONS ERROR", e);
    return NextResponse.json([], { status: 200 });
  }
}
