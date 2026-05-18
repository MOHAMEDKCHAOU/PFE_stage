"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Stats = {
  totalUsers: number;
  totalIdentities: number;
  totalCapsules: number;
  totalProjects: number;
  totalTestimonials: number;
  totalSessions: number;
  recentUsers: { id: string; email: string; role: string; createdAt: string }[];
  recentCapsules: {
    id: string;
    title: string;
    createdAt: string;
    identity: { name: string; user: { email: string } };
  }[];
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (res.status === 403 || res.status === 401) {
          router.push("/dashboard");
          return null;
        }
        return res.json();
      })
      .then((data) => data && setStats(data))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Utilisateurs", value: stats.totalUsers, icon: "👥", color: "from-violet-500 to-purple-600" },
    { label: "Identités", value: stats.totalIdentities, icon: "🪪", color: "from-blue-500 to-cyan-600" },
    { label: "Capsules", value: stats.totalCapsules, icon: "💊", color: "from-fuchsia-500 to-pink-600" },
    { label: "Projets", value: stats.totalProjects, icon: "📁", color: "from-emerald-500 to-teal-600" },
    { label: "Témoignages", value: stats.totalTestimonials, icon: "💬", color: "from-amber-500 to-orange-600" },
    { label: "Sessions", value: stats.totalSessions, icon: "📊", color: "from-rose-500 to-red-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Administration</h1>
        </div>
        <p className="text-slate-500 text-sm">Vue d&apos;ensemble de la plateforme Faymoos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl bg-zinc-900/45 p-5 shadow-sm ring-1 ring-slate-100"
          >
            <div className={`absolute top-0 right-0 h-20 w-20 rounded-bl-[3rem] bg-gradient-to-br ${stat.color} opacity-10`} />
            <span className="text-2xl">{stat.icon}</span>
            <p className="mt-2 text-2xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/admin/users"
          className="group flex items-center gap-4 rounded-2xl bg-zinc-900/45 p-5 shadow-sm ring-1 ring-slate-100 hover:ring-violet-200 transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
            <svg className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Gérer les utilisateurs</h3>
            <p className="text-sm text-slate-500">{stats.totalUsers} utilisateurs inscrits</p>
          </div>
          <svg className="h-5 w-5 text-slate-300 ml-auto group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          href="/dashboard/admin/capsules"
          className="group flex items-center gap-4 rounded-2xl bg-zinc-900/45 p-5 shadow-sm ring-1 ring-slate-100 hover:ring-fuchsia-200 transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-fuchsia-100 flex items-center justify-center group-hover:bg-fuchsia-200 transition-colors">
            <svg className="h-6 w-6 text-fuchsia-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Gérer les capsules</h3>
            <p className="text-sm text-slate-500">{stats.totalCapsules} capsules créées</p>
          </div>
          <svg className="h-5 w-5 text-slate-300 ml-auto group-hover:text-fuchsia-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          href="/dashboard/admin/badges"
          className="group flex items-center gap-4 rounded-2xl bg-zinc-900/45 p-5 shadow-sm ring-1 ring-slate-100 hover:ring-amber-200 transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <svg className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 00-.84.61l-4.15-2.666a.563.563 0 00-.576 0l-4.15 2.666a.562.562 0 00-.84-.61l1.285-5.385a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 00.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Badges &amp; crédibilité</h3>
            <p className="text-sm text-slate-500">Catalogue, attribution admin, score</p>
          </div>
          <svg className="h-5 w-5 text-slate-300 ml-auto group-hover:text-amber-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* Recent Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="rounded-2xl bg-zinc-900/45 shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Derniers utilisateurs</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{u.email}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.role === "ADMIN"
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Capsules */}
        <div className="rounded-2xl bg-zinc-900/45 shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Dernières capsules</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recentCapsules.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{c.title}</p>
                  <p className="text-xs text-slate-400">
                    par {c.identity.name} ({c.identity.user.email})
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
