import { prisma } from "@/lib/prisma";
import { requireAffiliate } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit-memory";
import { buildStudioClientsPdfBuffer } from "@/lib/studio-clients-pdf";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EXPORT_LIMIT = 40;
const EXPORT_WINDOW_MS = 60 * 60 * 1000;
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsvRow(cells: string[]): string {
  return cells.map(csvEscape).join(",");
}

/** GET — export CSV ou PDF des clients liés (+ dates) pour reporting / facturation */
export async function GET(req: Request) {
  const affiliateId = await requireAffiliate();
  if (!affiliateId) {
    return NextResponse.json({ error: "Réservé aux comptes Studio (affilié)" }, { status: 403 });
  }

  const rawFmt = new URL(req.url).searchParams.get("format")?.toLowerCase() ?? "csv";
  if (rawFmt !== "csv" && rawFmt !== "pdf") {
    return NextResponse.json({ error: "Paramètre format : csv ou pdf" }, { status: 400 });
  }
  const isPdf = rawFmt === "pdf";

  const limited = checkRateLimit(`studio-clients-export:${affiliateId}`, EXPORT_LIMIT, EXPORT_WINDOW_MS);
  if (!limited.ok) {
    const sec = Math.ceil(limited.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Trop d’exports. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(sec) } },
    );
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  if (isPdf) {
    const since = new Date(now.getTime() - WINDOW_MS);

    const [affiliate, links, pendingInvites, invitesLast30d] = await Promise.all([
      prisma.user.findUnique({
        where: { id: affiliateId },
        select: { email: true },
      }),
      prisma.affiliateClient.findMany({
        where: { affiliateUserId: affiliateId },
        select: {
          createdAt: true,
          clientUserId: true,
          client: {
            select: {
              email: true,
              createdAt: true,
              _count: { select: { identityProfiles: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.studioClientInvite.count({
        where: {
          affiliateUserId: affiliateId,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
      }),
      prisma.studioClientInvite.findMany({
        where: {
          affiliateUserId: affiliateId,
          createdAt: { gte: since },
        },
        select: { acceptedAt: true },
      }),
    ]);

    const studioEmail = affiliate?.email ?? "";
    const invitesCreatedLast30Days = invitesLast30d.length;
    const invitesAcceptedLast30Days = invitesLast30d.filter((r) => r.acceptedAt != null).length;
    const acceptanceRateLast30Days =
      invitesCreatedLast30Days === 0
        ? null
        : Math.round((1000 * invitesAcceptedLast30Days) / invitesCreatedLast30Days) / 10;

    const totalIdentities = links.reduce((a, r) => a + r.client._count.identityProfiles, 0);

    const buffer = buildStudioClientsPdfBuffer({
      studioEmail,
      generatedAt: now,
      clients: links.map((row) => ({
        clientEmail: row.client.email,
        clientUserId: row.clientUserId,
        linkedAt: row.createdAt,
        clientCreatedAt: row.client.createdAt,
        identityCount: row.client._count.identityProfiles,
      })),
      summary: {
        pendingInvites,
        invitesCreatedLast30Days,
        invitesAcceptedLast30Days,
        acceptanceRateLast30Days,
        totalIdentities,
      },
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="faymoos-studio-rapport-${dateStr}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const [affiliate, links] = await Promise.all([
    prisma.user.findUnique({
      where: { id: affiliateId },
      select: { email: true },
    }),
    prisma.affiliateClient.findMany({
      where: { affiliateUserId: affiliateId },
      select: {
        createdAt: true,
        clientUserId: true,
        client: {
          select: {
            email: true,
            createdAt: true,
            _count: { select: { identityProfiles: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const studioEmail = affiliate?.email ?? "";

  const header = toCsvRow([
    "email_client",
    "id_client",
    "date_liaison_iso",
    "date_compte_client_iso",
    "nb_identites",
    "email_studio",
  ]);

  const lines = links.map((row) =>
    toCsvRow([
      row.client.email,
      row.clientUserId,
      row.createdAt.toISOString(),
      row.client.createdAt.toISOString(),
      String(row.client._count.identityProfiles),
      studioEmail,
    ]),
  );

  const body = [header, ...lines].join("\r\n");
  const csv = `\uFEFF${body}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="faymoos-studio-clients-${dateStr}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
