import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await requirePermission("ai:use");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { text?: string } | null;
  if (!body?.text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });
  const base = process.env.FAYMOOS_AI_URL || "http://127.0.0.1:8020";
  try {
    const response = await fetch(`${base}/intent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: body.text.slice(0, 2000) }), signal: AbortSignal.timeout(20_000) });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Premium AI service is unavailable. Train/export the notebook artifacts and start services/ai." }, { status: 503 });
  }
}
