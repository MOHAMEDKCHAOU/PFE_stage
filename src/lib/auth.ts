import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  hasPermission,
  normalizeRole,
  permissionsForRole,
  type AppRole,
  type Permission,
} from "./rbac-policy";

export const SESSION_COOKIE = "faymoos_session_v2";
const LEGACY_SESSION_COOKIE = "faymoos_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type AuthContext = {
  userId: string;
  role: AppRole;
  status: string;
  permissions: readonly Permission[];
  sessionId: string;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAuthSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      lastSeenAt: new Date(),
    },
  });

  return { token, expiresAt };
}

export async function setAuthCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
  // Force old insecure UUID sessions to expire after the RBAC v2 upgrade.
  cookieStore.delete(LEGACY_SESSION_COOKIE);
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;

  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      lastSeenAt: true,
      user: {
        select: {
          id: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  if (!session.user || session.user.status !== "ACTIVE") return null;

  const role = normalizeRole(session.user.role);

  // Keep useful session activity without turning every request into a write storm.
  const staleLastSeen =
    !session.lastSeenAt || Date.now() - session.lastSeenAt.getTime() > 15 * 60 * 1000;
  if (staleLastSeen) {
    void prisma.authSession
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  return {
    userId: session.user.id,
    role,
    status: session.user.status,
    permissions: permissionsForRole(role),
    sessionId: session.id,
  };
}

export async function getUserId(): Promise<string | null> {
  return (await getAuthContext())?.userId ?? null;
}

export async function requirePermission(permission: Permission): Promise<AuthContext | null> {
  const auth = await getAuthContext();
  if (!auth || !hasPermission(auth.role, permission)) return null;
  return auth;
}

export async function requireAnyPermission(
  permissions: readonly Permission[],
): Promise<AuthContext | null> {
  const auth = await getAuthContext();
  if (!auth) return null;
  return permissions.some((permission) => hasPermission(auth.role, permission)) ? auth : null;
}

export async function requireAdmin(): Promise<string | null> {
  const auth = await requirePermission("admin:stats:read");
  return auth?.userId ?? null;
}

/** Session utilisateur avec accès Studio. */
export async function requireAffiliate(): Promise<string | null> {
  const auth = await requirePermission("studio:access");
  return auth?.userId ?? null;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (rawToken) {
    const tokenHash = hashSessionToken(rawToken);
    await prisma.authSession
      .updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(LEGACY_SESSION_COOKIE);
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
