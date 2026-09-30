import { cancelJoinRequest, getJoinPreview, postJoinRequest } from "@/route-handlers/api/studio/join/handlers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  return getJoinPreview(req, code);
}

export async function POST(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  return postJoinRequest(req, code);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  return cancelJoinRequest(req, code);
}
