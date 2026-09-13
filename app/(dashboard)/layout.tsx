"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";

type Me = {
  email?: string;
  role?: string;
  roleLabel?: string;
  permissions?: string[];
  identityProfiles?: Array<{ name?: string }>;
};

type NavItem = {
  label: string;
  href: string;
  hint: string;
  icon: React.ReactNode;
  permission?: string;
};

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]" aria-hidden>
    {children}
  </svg>
);

const groups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Faymoos",
    items: [
      { label: "Home", href: "/dashboard", hint: "What needs your attention now", permission: "dashboard:view", icon: <Icon><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></Icon> },
      { label: "My Presence", href: "/dashboard/identities", hint: "Profile, portfolio, testimonials and trust", permission: "identity:read", icon: <Icon><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></Icon> },
      { label: "Experiences", href: "/dashboard/experiences", hint: "Guided journeys and 360 Smart Spaces", permission: "capsules:manage", icon: <Icon><path d="M4 6h16v12H4z" /><path d="m8 10 4 4 4-4" /></Icon> },
      { label: "Audience", href: "/dashboard/audience", hint: "Analytics, leads, conversations and feedback", permission: "analytics:read", icon: <Icon><path d="M5 20V10M12 20V4M19 20v-7" /></Icon> },
      { label: "Library", href: "/dashboard/assets", hint: "Reusable media and files", permission: "assets:manage", icon: <Icon><rect x="4" y="5" width="16" height="14" rx="2" /><path d="m5 17 4-4 3 3 2-2 5 5" /></Icon> },
      { label: "Explore", href: "/explore", hint: "Discover public Faymoos experiences", permission: "dashboard:view", icon: <Icon><circle cx="12" cy="12" r="8" /><path d="m15 9-2 4-4 2 2-4z" /></Icon> },
      { label: "Settings", href: "/dashboard/settings", hint: "Account, security, notifications and billing", permission: "dashboard:view", icon: <Icon><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.4 3h-4.8l-.3 3.1a8 8 0 0 0-1.8 1l-2.4-1-2 3.4L5.1 11A7 7 0 0 0 5 12c0 .3 0 .7.1 1l-2 1.5" /></Icon> },
    ],
  },
];

const studioItem: NavItem = {
  label: "Client Studio",
  href: "/dashboard/studio",
  hint: "Managed client workspace",
  permission: "studio:access",
  icon: <Icon><path d="M4 19V8l8-4 8 4v11M8 19v-6h8v6" /></Icon>,
};

const adminItems: NavItem[] = [
  { label: "Admin overview", href: "/dashboard/admin", hint: "Platform controls", permission: "admin:stats:read", icon: <Icon><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.4 3h-4.8l-.3 3.1a8 8 0 0 0-1.8 1l-2.4-1-2 3.4L5.1 11A7 7 0 0 0 5 12c0 .3 0 .7.1 1l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.8 1l.3 3.1h4.8l.3-3.1a8 8 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" /></Icon> },
  { label: "Users & roles", href: "/dashboard/admin/users", hint: "Accounts, roles and status", permission: "admin:users:read", icon: <Icon><circle cx="9" cy="9" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 8h5M18.5 5.5v5" /></Icon> },
  { label: "Capsule moderation", href: "/dashboard/admin/capsules", hint: "Review published content", permission: "admin:capsules:moderate", icon: <Icon><path d="M5 6h14v12H5zM8 10h8M8 14h5" /></Icon> },
  { label: "Badge rules", href: "/dashboard/admin/badges", hint: "Grant and revoke trust signals", permission: "admin:badges:manage", icon: <Icon><path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.2l5-.7z" /></Icon> },
  { label: "Access control", href: "/dashboard/admin/access", hint: "RBAC matrix and audit trail", permission: "admin:audit:read", icon: <Icon><path d="M12 3 5 6v5c0 4.4 2.9 8.3 7 9.6 4.1-1.3 7-5.2 7-9.6V6z" /><path d="m9 12 2 2 4-5" /></Icon> },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => data && setMe(data))
      .catch(() => {});
  }, [router]);

  const can = (permission?: string) => !permission || Boolean(me?.permissions?.includes(permission));

  const visibleGroups = useMemo(() => {
    const base = groups
      .map((group) => ({ ...group, items: group.items.filter((item) => !item.permission || me?.permissions?.includes(item.permission)) }))
      .filter((group) => group.items.length > 0);

    if (me?.permissions?.includes("studio:access")) {
      const workspaceIndex = Math.min(1, base.length);
      base.splice(workspaceIndex, 0, { label: "Studio", items: [studioItem] });
    }
    return base;
  }, [me?.permissions]);

  const visibleAdminItems = useMemo(
    () => adminItems.filter((item) => !item.permission || me?.permissions?.includes(item.permission)),
    [me?.permissions],
  );

  const title = [...visibleGroups.flatMap((group) => group.items), ...visibleAdminItems].find((item) => isActivePath(pathname, item.href))?.label ?? "Faymoos";
  const displayName = me?.identityProfiles?.[0]?.name || me?.email?.split("@")[0] || "Creator";

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#F7F4EE]">
      {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[282px] flex-col border-r border-white/10 bg-[#0B0D10] transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#C6A15B]/40 bg-[#C6A15B]/10 text-lg font-black text-[#C6A15B]">F</span>
            <div>
              <div className="text-[15px] font-semibold tracking-tight">Faymoos</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#C6A15B]">Creator OS</div>
            </div>
          </Link>
          <button className="rounded-lg p-2 text-white/50 hover:bg-white/5 lg:hidden" onClick={() => setSidebarOpen(false)}>×</button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} title={item.hint}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-[#C6A15B] text-[#0B0D10]" : "text-white/66 hover:bg-white/[0.055] hover:text-[#F7F4EE]"}`}>
                      <span className={active ? "text-[#0B0D10]" : "text-white/42 group-hover:text-[#C6A15B]"}>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {visibleAdminItems.length > 0 && (
            <div className="mb-5 border-t border-white/10 pt-5">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Administration</p>
              <div className="space-y-1">
                {visibleAdminItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-[#C6A15B] text-[#0B0D10]" : "text-white/66 hover:bg-white/[0.055] hover:text-[#F7F4EE]"}`}>
                      <span className={active ? "text-[#0B0D10]" : "text-white/42 group-hover:text-[#C6A15B]"}>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 rounded-xl bg-white/[0.035] px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#C6A15B]/15 text-sm font-semibold text-[#C6A15B]">{displayName.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-[11px] text-white/38">{me?.email || "Loading account…"}</p>
              </div>
            </div>
            {me?.roleLabel && (
              <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/28">Access</span>
                <span className="rounded-full border border-[#C6A15B]/25 bg-[#C6A15B]/8 px-2 py-1 text-[10px] font-semibold text-[#C6A15B]">{me.roleLabel}</span>
              </div>
            )}
          </div>
          <button disabled={loggingOut} onClick={handleLogout} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/45 transition hover:bg-white/5 hover:text-[#F7F4EE] disabled:opacity-50">{loggingOut ? "Signing out…" : "Sign out"}</button>
        </div>
      </aside>

      <div className="lg:pl-[282px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center gap-4 border-b border-white/10 bg-[#0B0D10]/90 px-4 backdrop-blur-xl sm:px-7">
          <button onClick={() => setSidebarOpen(true)} className="rounded-xl border border-white/10 p-2 text-white/70 lg:hidden" aria-label="Open navigation"><span className="block text-xl leading-none">☰</span></button>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{title}</p><p className="hidden text-xs text-white/35 sm:block">Build your presence, create experiences, convert attention into action.</p></div>
          <Link href="/explore" className="hidden rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-white/65 transition hover:border-[#C6A15B]/50 hover:text-[#F7F4EE] sm:inline-flex">Explore</Link>
          <NotificationBell />
        </header>
        <main className="min-h-[calc(100vh-76px)] bg-[radial-gradient(circle_at_80%_0%,rgba(198, 161, 91, 0.08),transparent_28%)]">
          <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-7 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
