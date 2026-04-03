"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Stats = {
  totalClients: number;
  totalCapsules: number;
  totalSessions: number;
  totalCtaClicks: number;
  totalMessages: number;
  recentClients: {
    id: string;
    email: string;
    createdAt: string;
    identityProfiles: { name: string; avatar: string | null }[];
  }[];
};

export default function AffiliateurDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/affiliateur/stats")
      .then((res) => {
        if (res.status === 401) {
          router.push("/dashboard");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-slate-500">
        Impossible de charger les statistiques
      </div>
    );
  }

  const statCards = [
    {
      label: "Clients",
      value: stats.totalClients,
      icon: "👥",
      color: "bg-amber-50 text-amber-700 ring-amber-200",
      href: "/dashboard/affiliateur/clients",
    },
    {
      label: "Capsules",
      value: stats.totalCapsules,
      icon: "💬",
      color: "bg-violet-50 text-violet-700 ring-violet-200",
      href: "/dashboard/affiliateur/capsules",
    },
    {
      label: "Sessions",
      value: stats.totalSessions,
      icon: "📊",
      color: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      href: "/dashboard/affiliateur/analytics",
    },
    {
      label: "CTA Clicks",
      value: stats.totalCtaClicks,
      icon: "🎯",
      color: "bg-blue-50 text-blue-700 ring-blue-200",
      href: "/dashboard/affiliateur/analytics",
    },
    {
      label: "Messages",
      value: stats.totalMessages,
      icon: "✉️",
      color: "bg-pink-50 text-pink-700 ring-pink-200",
      href: "/dashboard/messages",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Tableau de bord Affiliateur
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Vue d&apos;ensemble de vos clients et leurs performances
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl p-4 ring-1 transition-all duration-200 hover:shadow-md ${card.color}`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs font-medium opacity-70 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Clients */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Clients récents
          </h2>
          <Link
            href="/dashboard/affiliateur/clients"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            Voir tous →
          </Link>
        </div>

        {stats.recentClients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-4">
              Vous n&apos;avez pas encore de clients
            </p>
            <Link
              href="/dashboard/affiliateur/clients"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Inviter un client
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentClients.map((client) => {
              const profile = client.identityProfiles[0];
              return (
                <div
                  key={client.id}
                  className="flex items-center gap-4 rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold text-sm">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      (profile?.name || client.email)[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {profile?.name || client.email}
                    </p>
                    <p className="text-xs text-slate-400">{client.email}</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/affiliateur/clients"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-200"
        >
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg">
            ➕
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Inviter un client</p>
            <p className="text-xs text-slate-400">Créer un compte client</p>
          </div>
        </Link>
        <Link
          href="/dashboard/affiliateur/capsules"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-violet-200 hover:bg-violet-50/50 transition-all duration-200"
        >
          <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg">
            💬
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Créer une capsule</p>
            <p className="text-xs text-slate-400">Pour un de vos clients</p>
          </div>
        </Link>
        <Link
          href="/dashboard/affiliateur/analytics"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-200"
        >
          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-lg">
            📈
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Voir analytics</p>
            <p className="text-xs text-slate-400">Performance des clients</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
