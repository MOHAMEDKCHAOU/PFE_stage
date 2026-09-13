export const APP_ROLES = [
  "USER",
  "AFFILIATE",
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const PERMISSIONS = [
  "dashboard:view",
  "identity:read",
  "identity:create",
  "identity:update",
  "identity:delete",
  "portfolio:manage",
  "testimonials:manage",
  "capsules:manage",
  "capsules:publish",
  "analytics:read",
  "ai:use",
  "assets:manage",
  "spaces:manage",
  "spaces:publish",
  "messages:manage",
  "leads:manage",
  "comments:moderate",
  "billing:manage",
  "studio:access",
  "studio:clients:manage",
  "admin:stats:read",
  "admin:users:read",
  "admin:users:write",
  "admin:users:delete",
  "admin:capsules:moderate",
  "admin:badges:manage",
  "admin:audit:read",
  "admin:security:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const CREATOR_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "identity:read",
  "identity:create",
  "identity:update",
  "identity:delete",
  "portfolio:manage",
  "testimonials:manage",
  "capsules:manage",
  "capsules:publish",
  "analytics:read",
  "ai:use",
  "assets:manage",
  "spaces:manage",
  "spaces:publish",
  "messages:manage",
  "leads:manage",
  "comments:moderate",
  "billing:manage",
];

const MODERATION_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "admin:stats:read",
  "admin:capsules:moderate",
  "admin:badges:manage",
  "admin:audit:read",
];

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  USER: CREATOR_PERMISSIONS,
  AFFILIATE: [
    ...CREATOR_PERMISSIONS,
    "studio:access",
    "studio:clients:manage",
  ],
  MODERATOR: [...CREATOR_PERMISSIONS, ...MODERATION_PERMISSIONS],
  ADMIN: [
    ...CREATOR_PERMISSIONS,
    ...MODERATION_PERMISSIONS,
    "admin:users:read",
    "admin:users:write",
  ],
  SUPER_ADMIN: PERMISSIONS,
};

export const ROLE_DEFINITIONS: Record<
  AppRole,
  { label: string; shortLabel: string; description: string; level: number }
> = {
  USER: {
    label: "Creator",
    shortLabel: "Creator",
    description: "Own workspace: identities, portfolio, capsules, analytics and AI.",
    level: 10,
  },
  AFFILIATE: {
    label: "Studio / Affiliate",
    shortLabel: "Studio",
    description: "Creator access plus delegated Studio client management.",
    level: 20,
  },
  MODERATOR: {
    label: "Moderator",
    shortLabel: "Moderator",
    description: "Platform moderation and trust operations without account administration.",
    level: 30,
  },
  ADMIN: {
    label: "Administrator",
    shortLabel: "Admin",
    description: "Platform operations and user role management, excluding super-admin actions.",
    level: 40,
  },
  SUPER_ADMIN: {
    label: "Super Administrator",
    shortLabel: "Super Admin",
    description: "Full access, security controls, privileged role changes and destructive actions.",
    level: 50,
  },
};

export function normalizeRole(role?: string | null): AppRole {
  if (role && (APP_ROLES as readonly string[]).includes(role)) {
    return role as AppRole;
  }
  return "USER";
}

export function permissionsForRole(role?: string | null): readonly Permission[] {
  return ROLE_PERMISSIONS[normalizeRole(role)];
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

export function isPrivilegedRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === "ADMIN" || normalized === "SUPER_ADMIN";
}

/**
 * Platform-role mutation rules.
 * - SUPER_ADMIN can manage every role except demoting itself through normal UI.
 * - ADMIN can manage USER / AFFILIATE / MODERATOR only.
 * - MODERATOR and lower cannot manage roles.
 */
export function canManagePlatformRole(
  actorRole: string | null | undefined,
  targetCurrentRole: string | null | undefined,
  requestedRole?: string | null,
): boolean {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetCurrentRole);
  const requested = requestedRole ? normalizeRole(requestedRole) : undefined;

  if (actor === "SUPER_ADMIN") return true;
  if (actor !== "ADMIN") return false;

  const protectedRoles: AppRole[] = ["ADMIN", "SUPER_ADMIN"];
  if (protectedRoles.includes(target)) return false;
  if (requested && protectedRoles.includes(requested)) return false;
  return true;
}

export function isValidRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}
