import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { getManagedUserIdsForViewer } from "@/lib/studio-access";
import { NextResponse } from "next/server";

function csvEscape(s: string) {
  const v = String(s);
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** GET /api/capsule-comments/export — CSV modération (propriétaire + Studio) */
export async function GET() {
  const auth = await requirePermission("comments:moderate");
    if (!auth) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const userId = auth.userId;

  const ownerIds = await getManagedUserIdsForViewer(userId);
  const rows = await prisma.capsuleComment.findMany({
    where: { capsule: { identity: { userId: { in: ownerIds } } } },
    orderBy: { createdAt: "desc" },
    include: {
      capsule: { select: { title: true, identity: { select: { name: true, slug: true } } } },
    },
  });

  const header = [
    "createdAt",
    "capsuleTitle",
    "identitySlug",
    "status",
    "isOwnerReply",
    "authorName",
    "authorEmail",
    "body",
    "parentId",
  ].join(",");
  const lines = rows.map((r) =>
    [
      csvEscape(r.createdAt.toISOString()),
      csvEscape(r.capsule.title),
      csvEscape(r.capsule.identity.slug),
      csvEscape(r.status),
      r.isOwnerReply ? "1" : "0",
      csvEscape(r.authorName),
      csvEscape(r.authorEmail ?? ""),
      csvEscape(r.body),
      csvEscape(r.parentId ?? ""),
    ].join(","),
  );

  const csv = [header, ...lines].join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="faymoos-capsule-comments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
