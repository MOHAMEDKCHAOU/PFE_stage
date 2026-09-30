import { NextRequest } from "next/server";
import { deleteHotspot, updateHotspot } from "@/route-handlers/api/spaces/hotspots";

type Ctx = { params: Promise<{ id: string; hotspotId: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id, hotspotId } = await params;
  return updateHotspot(request, id, hotspotId);
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id, hotspotId } = await params;
  return deleteHotspot(request, id, hotspotId);
}
