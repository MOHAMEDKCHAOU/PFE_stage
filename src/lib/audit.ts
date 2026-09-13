import { prisma } from "./prisma";

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "USER_ROLE_CHANGED"
  | "USER_STATUS_CHANGED"
  | "USER_DELETED"
  | "CAPSULE_MODERATED"
  | "BADGE_GRANTED"
  | "BADGE_REVOKED";

export async function writeAuditLog(input: {
  actorUserId?: string | null;
  action: AuditAction | string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        metadata: input.metadata == null ? undefined : JSON.parse(JSON.stringify(input.metadata)),
      },
    });
  } catch (error) {
    // Audit logging should never make the business request fail.
    console.error("AUDIT LOG ERROR", error);
  }
}
