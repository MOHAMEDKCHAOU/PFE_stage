import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  APP_ROLES,
  ROLE_DEFINITIONS,
  ROLE_PERMISSIONS,
  type Permission,
} from "@/lib/rbac-policy";
import { redirect } from "next/navigation";

const permissionGroups: Array<{ label: string; permissions: Permission[] }> = [
  {
    label: "Creator workspace",
    permissions: [
      "identity:create",
      "identity:update",
      "portfolio:manage",
      "capsules:manage",
      "analytics:read",
      "ai:use",
    ],
  },
  {
    label: "Studio",
    permissions: ["studio:access", "studio:clients:manage"],
  },
  {
    label: "Platform operations",
    permissions: [
      "admin:stats:read",
      "admin:capsules:moderate",
      "admin:badges:manage",
      "admin:audit:read",
    ],
  },
  {
    label: "Security administration",
    permissions: [
      "admin:users:read",
      "admin:users:write",
      "admin:users:delete",
      "admin:security:manage",
    ],
  },
];

function permissionLabel(permission: Permission) {
  const map: Partial<Record<Permission, string>> = {
    "identity:create": "Create identities",
    "identity:update": "Edit identities",
    "portfolio:manage": "Manage portfolio",
    "capsules:manage": "Manage capsules",
    "analytics:read": "Read analytics",
    "ai:use": "Use AI tools",
    "studio:access": "Open Studio",
    "studio:clients:manage": "Manage Studio clients",
    "admin:stats:read": "Read platform stats",
    "admin:capsules:moderate": "Moderate capsules",
    "admin:badges:manage": "Manage badges",
    "admin:audit:read": "Read audit log",
    "admin:users:read": "Read users",
    "admin:users:write": "Change roles/status",
    "admin:users:delete": "Delete users",
    "admin:security:manage": "Security controls",
  };
  return map[permission] ?? permission;
}

export default async function AccessControlPage() {
  const auth = await requirePermission("admin:audit:read");
  if (!auth) redirect("/dashboard");

  const audit = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      createdAt: true,
      actor: { select: { email: true, role: true } },
    },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A15B]">Security</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#F7F4EE]">Access control</h1>
          <p className="mt-3 text-sm leading-6 text-white/52">
            Faymoos now uses one central RBAC policy for navigation, APIs and administration. Roles no longer rely on scattered UI checks.
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-[#F7F4EE]">Role matrix</h2>
          <p className="mt-1 text-sm text-white/42">A check means that the role receives the permission from the central policy.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-black/15 text-xs uppercase tracking-[0.1em] text-white/35">
              <tr>
                <th className="px-5 py-4">Permission</th>
                {APP_ROLES.map((role) => (
                  <th key={role} className="px-4 py-4 text-center">{ROLE_DEFINITIONS[role].shortLabel}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {permissionGroups.flatMap((group) => [
                <tr key={`${group.label}-heading`} className="bg-[#C6A15B]/[0.035]">
                  <td colSpan={APP_ROLES.length + 1} className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#C6A15B]">
                    {group.label}
                  </td>
                </tr>,
                ...group.permissions.map((permission) => (
                  <tr key={permission}>
                    <td className="px-5 py-3.5 text-white/70">{permissionLabel(permission)}</td>
                    {APP_ROLES.map((role) => {
                      const allowed = ROLE_PERMISSIONS[role].includes(permission);
                      return (
                        <td key={role} className="px-4 py-3.5 text-center">
                          <span className={allowed ? "text-[#C6A15B]" : "text-white/16"}>{allowed ? "●" : "—"}</span>
                        </td>
                      );
                    })}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-[#F7F4EE]">Recent security activity</h2>
          <p className="mt-1 text-sm text-white/42">Role changes, suspensions, logins and privileged operations are auditable.</p>
        </div>
        <div className="divide-y divide-white/8">
          {audit.length === 0 ? (
            <div className="px-6 py-10 text-sm text-white/35">No audit activity yet.</div>
          ) : (
            audit.map((row) => (
              <div key={row.id} className="grid gap-2 px-6 py-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-medium text-[#F7F4EE]">{row.action.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-xs text-white/36">{row.targetType}{row.targetId ? ` · ${row.targetId.slice(0, 8)}…` : ""}</p>
                </div>
                <p className="text-xs text-white/48">{row.actor?.email ?? "System"}</p>
                <time className="text-xs text-white/30">{row.createdAt.toLocaleString("en-GB")}</time>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
