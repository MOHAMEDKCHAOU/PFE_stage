import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

const VALID_STATUS = new Set(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]);

export async function GET() {
  const auth = await requirePermission("leads:manage");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await prisma.lead.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    include: { identity: { select: { id: true, name: true, slug: true } } },
    take: 250,
  });
  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.identityId !== "string" || typeof body.name !== "string") {
    return NextResponse.json({ error: "identityId and name are required" }, { status: 400 });
  }
  const identity = await prisma.identityProfile.findUnique({
    where: { id: body.identityId },
    select: { id: true, userId: true },
  });
  if (!identity) return NextResponse.json({ error: "Identity not found" }, { status: 404 });
  const lead = await prisma.lead.create({
    data: {
      userId: identity.userId,
      identityId: identity.id,
      name: body.name.trim().slice(0, 120),
      email: typeof body.email === "string" ? body.email.trim().slice(0, 180) : null,
      phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 80) : null,
      message: typeof body.message === "string" ? body.message.trim().slice(0, 4000) : null,
      source: typeof body.source === "string" ? body.source.slice(0, 80) : "PUBLIC_CTA",
      capsuleId: typeof body.capsuleId === "string" ? body.capsuleId : null,
      branchLabel: typeof body.branchLabel === "string" ? body.branchLabel.slice(0, 160) : null,
    },
  });
  await prisma.notification.create({
    data: { userId: identity.userId, type: "NEW_LEAD", title: "New lead", body: `${lead.name} became a lead.`, link: "/dashboard/leads" },
  }).catch(() => undefined);
  return NextResponse.json({ lead: { id: lead.id, status: lead.status } }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermission("leads:manage");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; status?: string } | null;
  if (!body?.id || !body.status || !VALID_STATUS.has(body.status)) {
    return NextResponse.json({ error: "Valid id and status are required" }, { status: 400 });
  }
  const found = await prisma.lead.findFirst({ where: { id: body.id, userId: auth.userId }, select: { id: true } });
  if (!found) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const lead = await prisma.lead.update({ where: { id: body.id }, data: { status: body.status } });
  return NextResponse.json({ lead });
}
