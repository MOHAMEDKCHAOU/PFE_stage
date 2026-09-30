import { NextRequest } from "next/server";
import { createHotspot } from "@/route-handlers/api/spaces/hotspots";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return createHotspot(request, id);
}
