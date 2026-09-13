"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Stats = {
  viewer: { role: string; permissions: string[] };
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalIdentities: number;
  totalCapsules: number;
  totalProjects: number;
  totalTestimonials: number;
  totalSessions: number;
  recentUsers: Array<{ id: string; email: string; role: string; status: string; createdAt: string }>;
  recentCapsules: Array<{
    id: string;
    title: string;
    createdAt: string;
    identity: { name: string; user: { email: string } };
  }>;
};

const cards = [
  ["Users", "totalUsers"],
  ["Identities", "totalIdentities"],
  ["Capsules", "totalCapsules"],
  ["Sessions", "totalSessions"],
] as const;

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.replace("/dashboard");
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => data && setStats(data))
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  const quickLinks = useMemo(() => {
    if (!stats) return [];
    const has = (permission: string) => stats.viewer.permissions.includes(permission);
    return [
      has("admin:users:read") && { href: "/dashboard/admin/users", title: "Users & roles", text: "Roles, suspension and account controls" },
      has("admin:capsules:moderate") && { href: "/dashboard/admin/capsules", title: "Moderation", text: "Review and remove platform capsules" },
      has("admin:badges:manage") && { href: "/dashboard/admin/badges", title: "Trust badges", text: "Grant and revoke credibility signals" },
      has("admin:audit:read") && { href: "/dashboard/admin/access", title: "Access control", text: "RBAC matrix and security activity" },
    ].filter(Boolean) as Array<{ href: string; title: string; text: string }>;
  }, [stats]);

  if (loading) {
    return <div className="grid min-h-[50vh] place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#C6A15B]" /></div>;
  }
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A15B]">Platform operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Administration</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">A smaller, permission-aware control surface. The platform shows only the tools your role is actually allowed to use, because decorative security is not security.</p>
          </div>
          <div className="rounded-2xl border border-[#C6A15B]/25 bg-[#C6A15B]/8 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Current role</p>
            <p className="mt-1 text-sm font-semibold text-[#C6A15B]">{stats.viewer.role.replaceAll("_", " ")}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, key]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-white/30">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#F7F4EE]">{stats[key]}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Account health</h2>
              <p className="mt-1 text-sm text-white/40">Active and suspended accounts.</p>
            </div>
            <span className="rounded-full border border-[#C6A15B]/20 bg-[#C6A15B]/8 px-3 py-1 text-xs font-semibold text-[#C6A15B]">{stats.totalUsers} total</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-black/10 p-4"><p className="text-sm text-white/42">Active</p><p className="mt-2 text-2xl font-semibold text-[#C6A15B]">{stats.activeUsers}</p></div>
            <div className="rounded-2xl border border-white/8 bg-black/10 p-4"><p className="text-sm text-white/42">Suspended</p><p className="mt-2 text-2xl font-semibold">{stats.suspendedUsers}</p></div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <h2 className="text-lg font-semibold">Content</h2>
          <p className="mt-1 text-sm text-white/40">Current platform inventory.</p>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-white/8 pb-3"><span className="text-white/45">Projects</span><strong>{stats.totalProjects}</strong></div>
            <div className="flex items-center justify-between border-b border-white/8 pb-3"><span className="text-white/45">Testimonials</span><strong>{stats.totalTestimonials}</strong></div>
            <div className="flex items-center justify-between"><span className="text-white/45">Capsule sessions</span><strong className="text-[#C6A15B]">{stats.totalSessions}</strong></div>
          </div>
        </div>
      </section>

      {quickLinks.length > 0 && (
        <section>
          <div className="mb-4"><h2 className="text-lg font-semibold">Your controls</h2><p className="mt-1 text-sm text-white/40">Only actions granted by your RBAC policy appear here.</p></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-[#C6A15B]/40 hover:bg-[#C6A15B]/[0.035]">
                <div className="flex items-center justify-between"><h3 className="font-semibold">{item.title}</h3><span className="text-[#C6A15B] transition group-hover:translate-x-0.5">→</span></div>
                <p className="mt-2 text-sm leading-5 text-white/40">{item.text}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 px-6 py-5"><h2 className="font-semibold">Recent users</h2></div>
          <div className="divide-y divide-white/8">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{user.email}</p><p className="mt-1 text-xs text-white/30">{user.role.replaceAll("_", " ")} · {user.status.toLowerCase()}</p></div>
                <time className="shrink-0 text-xs text-white/30">{new Date(user.createdAt).toLocaleDateString("en-GB")}</time>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 px-6 py-5"><h2 className="font-semibold">Recent capsules</h2></div>
          <div className="divide-y divide-white/8">
            {stats.recentCapsules.map((capsule) => (
              <div key={capsule.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{capsule.title}</p><p className="mt-1 truncate text-xs text-white/30">{capsule.identity.name} · {capsule.identity.user.email}</p></div><time className="shrink-0 text-xs text-white/30">{new Date(capsule.createdAt).toLocaleDateString("en-GB")}</time></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
