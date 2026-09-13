import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requirePermission("admin:audit:read");
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const action = req.nextUrl.searchParams.get("action")?.trim() || undefined;
  const limitRaw = Number(req.nextUrl.searchParams.get("limit") || 50);
  const limit = Math.max(1, Math.min(Number.isFinite(limitRaw) ? limitRaw : 50, 100));

  const rows = await prisma.auditLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { id: true, email: true, role: true } },
    },
  });

  return NextResponse.json(rows);
}
