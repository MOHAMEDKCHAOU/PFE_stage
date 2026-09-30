import { writeAuditLog } from "@/lib/audit";
import { deleteUploadFile } from "@/lib/asset-storage";
import { requirePermission, revokeAllUserSessions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canManagePlatformRole,
  isValidRole,
  ROLE_DEFINITIONS,
} from "@/lib/rbac-policy";
import { NextRequest, NextResponse } from "next/server";

const VALID_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
type AccountStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is AccountStatus {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

async function wouldRemoveLastActiveSuperAdmin(input: {
  targetRole: string;
  targetStatus?: string;
  requestedRole?: string;
  requestedStatus?: string;
}): Promise<boolean> {
  if (input.targetRole !== "SUPER_ADMIN" || input.targetStatus === "SUSPENDED") return false;

  const removesSuperRole =
    input.requestedRole !== undefined && input.requestedRole !== "SUPER_ADMIN";
  const suspendsAccount = input.requestedStatus === "SUSPENDED";
  if (!removesSuperRole && !suspendsAccount) return false;

  const activeSuperAdmins = await prisma.user.count({
    where: { role: "SUPER_ADMIN", status: "ACTIVE" },
  });
  return activeSuperAdmins <= 1;
}

export async function GET(req: NextRequest) {
  const auth = await requirePermission("admin:users:read");
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search")?.trim() || "";
  const users = await prisma.user.findMany({
    where: search ? { email: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { identityProfiles: true } },
      identityProfiles: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          avatar: true,
          _count: {
            select: {
              capsules: true,
              portfolioProjects: true,
              testimonials: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    actor: {
      id: auth.userId,
      role: auth.role,
      permissions: auth.permissions,
    },
    roles: Object.entries(ROLE_DEFINITIONS).map(([value, definition]) => ({
      value,
      ...definition,
    })),
    users,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requirePermission("admin:users:write");
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, status: true },
  });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const roleRequested = body.role !== undefined;
  const statusRequested = body.status !== undefined;
  if (!roleRequested && !statusRequested) {
    return NextResponse.json({ error: "Aucune modification demandée" }, { status: 400 });
  }

  if (roleRequested && !isValidRole(body.role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }
  if (statusRequested && !isValidStatus(body.status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  if (
    !canManagePlatformRole(
      auth.role,
      target.role,
      roleRequested ? body.role : target.role,
    )
  ) {
    return NextResponse.json(
      { error: "Votre rôle ne permet pas de modifier ce compte ou ce niveau d'accès." },
      { status: 403 },
    );
  }

  if (
    await wouldRemoveLastActiveSuperAdmin({
      targetRole: target.role,
      targetStatus: target.status,
      requestedRole: roleRequested ? body.role : undefined,
      requestedStatus: statusRequested ? body.status : undefined,
    })
  ) {
    return NextResponse.json(
      { error: "Au moins un Super Administrator actif doit rester sur la plateforme." },
      { status: 409 },
    );
  }

  if (id === auth.userId) {
    if (roleRequested && body.role !== auth.role) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle depuis cette page." },
        { status: 400 },
      );
    }
    if (statusRequested && body.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas suspendre votre propre compte." },
        { status: 400 },
      );
    }
  }

  const data: { role?: string; status?: string } = {};
  if (roleRequested) data.role = body.role;
  if (statusRequested) data.status = body.status;

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, role: true, status: true },
  });

  if (statusRequested && body.status === "SUSPENDED") {
    await revokeAllUserSessions(id);
  }

  if (roleRequested && body.role !== target.role) {
    await writeAuditLog({
      actorUserId: auth.userId,
      action: "USER_ROLE_CHANGED",
      targetType: "User",
      targetId: id,
      metadata: { from: target.role, to: body.role, email: target.email },
    });
  }
  if (statusRequested && body.status !== target.status) {
    await writeAuditLog({
      actorUserId: auth.userId,
      action: "USER_STATUS_CHANGED",
      targetType: "User",
      targetId: id,
      metadata: { from: target.status, to: body.status, email: target.email },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission("admin:users:delete");
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  if (id === auth.userId) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, status: true },
  });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  if (!canManagePlatformRole(auth.role, target.role)) {
    return NextResponse.json(
      { error: "Ce compte est protégé par la hiérarchie RBAC." },
      { status: 403 },
    );
  }

  if (
    await wouldRemoveLastActiveSuperAdmin({
      targetRole: target.role,
      targetStatus: target.status,
      requestedRole: "DELETED",
    })
  ) {
    return NextResponse.json(
      { error: "Impossible de supprimer le dernier Super Administrator actif." },
      { status: 409 },
    );
  }

  const identities = await prisma.identityProfile.findMany({
    where: { userId: id },
    select: { id: true },
  });
  const identityIds = identities.map((identity) => identity.id);
  const capsules = await prisma.capsule.findMany({
    where: { identityId: { in: identityIds } },
    select: { id: true },
  });
  const capsuleIds = capsules.map((capsule) => capsule.id);
  const sessions = await prisma.capsuleSession.findMany({
    where: { capsuleId: { in: capsuleIds } },
    select: { id: true },
  });
  const sessionIds = sessions.map((session) => session.id);
  const options = await prisma.capsuleOption.findMany({
    where: { capsuleId: { in: capsuleIds } },
    select: { id: true },
  });
  const optionIds = options.map((option) => option.id);
  const assetFiles = await prisma.userAsset.findMany({ where: { userId: id }, select: { url: true } });

  await writeAuditLog({
    actorUserId: auth.userId,
    action: "USER_DELETED",
    targetType: "User",
    targetId: id,
    metadata: { email: target.email, role: target.role },
  });

  await prisma.$transaction([
    prisma.capsuleEvent.deleteMany({ where: { sessionId: { in: sessionIds } } }),
    prisma.capsuleSession.deleteMany({ where: { capsuleId: { in: capsuleIds } } }),
    prisma.capsuleBranch.deleteMany({ where: { optionId: { in: optionIds } } }),
    prisma.capsuleOption.deleteMany({ where: { capsuleId: { in: capsuleIds } } }),
    prisma.capsuleComment.deleteMany({ where: { capsuleId: { in: capsuleIds } } }),
    prisma.favorite.deleteMany({ where: { OR: [{ userId: id }, { capsuleId: { in: capsuleIds } }] } }),
    prisma.capsule.deleteMany({ where: { id: { in: capsuleIds } } }),
    prisma.message.deleteMany({ where: { identityId: { in: identityIds } } }),
    prisma.testimonial.deleteMany({ where: { identityId: { in: identityIds } } }),
    prisma.portfolioProject.deleteMany({ where: { identityId: { in: identityIds } } }),
    prisma.identityProfile.deleteMany({ where: { id: { in: identityIds } } }),
    prisma.userBadge.deleteMany({ where: { userId: id } }),
    prisma.userAsset.deleteMany({ where: { userId: id } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
    prisma.subscriptionUsage.deleteMany({ where: { userId: id } }),
    prisma.affiliateClient.deleteMany({ where: { OR: [{ affiliateUserId: id }, { clientUserId: id }] } }),
    prisma.studioClientInvite.deleteMany({ where: { affiliateUserId: id } }),
    prisma.authSession.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  // Fichiers retirés du disque seulement après la suppression effective en base.
  await Promise.all(
    assetFiles.map((asset) => deleteUploadFile(asset.url).catch((e) => console.error("DELETE USER FILE", asset.url, e))),
  );

  return NextResponse.json({ success: true });
}
