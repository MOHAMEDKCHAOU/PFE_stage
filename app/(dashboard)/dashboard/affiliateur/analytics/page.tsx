"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Stats = {
  totalClients: number;
  totalCapsules: number;
  totalSessions: number;
  totalCtaClicks: number;
  totalMessages: number;
};

export default function AffiliateurAnalyticsPage() {
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-slate-500">
        Impossible de charger les analytics
      </div>
    );
  }

  const conversionRate =
    stats.totalSessions > 0
      ? ((stats.totalCtaClicks / stats.totalSessions) * 100).toFixed(1)
      : "0";

  const metrics = [
    {
      label: "Clients actifs",
      value: stats.totalClients,
      icon: "👥",
      desc: "Nombre total de clients gérés",
      color: "border-amber-200 bg-amber-50",
    },
    {
      label: "Capsules créées",
      value: stats.totalCapsules,
      icon: "💬",
      desc: "Capsules de tous vos clients",
      color: "border-violet-200 bg-violet-50",
    },
    {
      label: "Sessions visiteurs",
      value: stats.totalSessions,
      icon: "👁️",
      desc: "Visites sur les capsules clients",
      color: "border-blue-200 bg-blue-50",
    },
    {
      label: "Clics CTA",
      value: stats.totalCtaClicks,
      icon: "🎯",
      desc: "Call-to-action cliqués",
      color: "border-emerald-200 bg-emerald-50",
    },
    {
      label: "Taux de conversion",
      value: `${conversionRate}%`,
      icon: "📈",
      desc: "CTA clicks / sessions",
      color: "border-pink-200 bg-pink-50",
    },
    {
      label: "Messages reçus",
      value: stats.totalMessages,
      icon: "✉️",
      desc: "Messages via formulaires",
      color: "border-orange-200 bg-orange-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Analytics Clients
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Performance globale de vos clients sur la plateforme
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${metric.color}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {metric.label}
                </p>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {metric.value}
                </p>
                <p className="text-xs text-slate-400 mt-1">{metric.desc}</p>
              </div>
              <span className="text-2xl">{metric.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Résumé de performance
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-600">
              Capsules par client (moyenne)
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {stats.totalClients > 0
                ? (stats.totalCapsules / stats.totalClients).toFixed(1)
                : "0"}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-600">
              Sessions par capsule (moyenne)
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {stats.totalCapsules > 0
                ? (stats.totalSessions / stats.totalCapsules).toFixed(1)
                : "0"}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-600">
              Messages par client (moyenne)
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {stats.totalClients > 0
                ? (stats.totalMessages / stats.totalClients).toFixed(1)
                : "0"}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-slate-600">
              Taux de conversion global
            </span>
            <span className="text-sm font-semibold text-emerald-600">
              {conversionRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
