import { deleteAsset, getAsset, updateAsset } from "@/route-handlers/api/assets/item";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  return getAsset(req, (await params).id);
}

export async function PATCH(req: Request, { params }: Ctx) {
  return updateAsset(req, (await params).id);
}

export async function DELETE(req: Request, { params }: Ctx) {
  return deleteAsset(req, (await params).id);
}
