import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { getManagedUserIdsForViewer } from "@/lib/studio-access";
import { NextResponse } from "next/server";

function csvEscape(s: string) {
  const v = String(s);
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** GET /api/messages/export — export CSV des messages (propriétaire + Studio pour ses clients). */
export async function GET() {
  const auth = await requirePermission("messages:manage");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

  const ownerIds = await getManagedUserIdsForViewer(userId);
  const rows = await prisma.message.findMany({
    where: { identity: { userId: { in: ownerIds } } },
    orderBy: { createdAt: "desc" },
    include: { identity: { select: { name: true, slug: true } } },
  });

  const header = ["createdAt", "identityName", "slug", "name", "email", "content", "isRead"].join(",");
  const lines = rows.map((m) =>
    [
      csvEscape(m.createdAt.toISOString()),
      csvEscape(m.identity.name),
      csvEscape(m.identity.slug),
      csvEscape(m.name),
      csvEscape(m.email),
      csvEscape(m.content),
      m.isRead ? "1" : "0",
    ].join(","),
  );

  const csv = [header, ...lines].join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="faymoos-messages-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
