import { getPublicCapsuleComments, postPublicCapsuleComment } from "@/route-handlers/api/capsules/public-comments-handlers";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ capsuleId: string }> }) {
  const { capsuleId } = await ctx.params;
  if (!capsuleId) return new Response(JSON.stringify({ error: "capsuleId requis" }), { status: 400 });
  return getPublicCapsuleComments(capsuleId);
}

export async function POST(req: Request, ctx: { params: Promise<{ capsuleId: string }> }) {
  const { capsuleId } = await ctx.params;
  if (!capsuleId) return new Response(JSON.stringify({ error: "capsuleId requis" }), { status: 400 });
  return postPublicCapsuleComment(req, capsuleId);
}
