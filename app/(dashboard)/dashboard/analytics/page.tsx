"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────
type BranchPerformance = {
  label: string;
  clicks: number;
  ctaClicks: number;
};

type CapsuleAnalytics = {
  capsuleId: string;
  capsuleTitle: string;
  capsuleObjective: string;
  optionsCount: number;
  stats: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    abandonedSessions: number;
    abandonRate: number;
    avgDecisionTime: number;
    totalOptionClicks: number;
    totalCtaClicks: number;
  };
  branchPerformance: BranchPerformance[];
  sessionsByDay: Record<string, number>;
};

type Identity = {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
};

// ─── Stat Card ───────────────────────────────────────────
function StatCard({
  label,
  value,
  suffix,
  icon,
  color,
  subtext,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {value}
            {suffix && (
              <span className="text-base font-medium text-slate-500 ml-0.5">
                {suffix}
              </span>
            )}
          </p>
          {subtext && (
            <p className="mt-1 text-xs text-slate-400">{subtext}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Mini Bar Chart ──────────────────────────────────────
function MiniBarChart({
  data,
}: {
  data: { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-24 truncate text-right">
            {item.label}
          </span>
          <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
            <div
              className={`h-full rounded-lg transition-all duration-500 ${
                item.color || "bg-violet-500"
              }`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-600 w-10 text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Activity Sparkline (last 30 days) ───────────────────
function ActivityChart({
  sessionsByDay,
}: {
  sessionsByDay: Record<string, number>;
}) {
  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, count: sessionsByDay[key] || 0 });
  }
  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-[3px] h-16">
      {days.map((day) => (
        <div
          key={day.date}
          className="flex-1 rounded-t transition-all duration-300 cursor-default group relative"
          style={{
            height: `${Math.max((day.count / max) * 100, 4)}%`,
            backgroundColor:
              day.count > 0 ? "rgb(139, 92, 246)" : "rgb(241, 245, 249)",
          }}
          title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] rounded px-2 py-0.5 whitespace-nowrap z-10">
            {day.count}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Capsule Analytics Card ──────────────────────────────
function CapsuleAnalyticsCard({
  data,
  identity,
}: {
  data: CapsuleAnalytics;
  identity: Identity;
}) {
  const [expanded, setExpanded] = useState(false);
  const { stats } = data;

  // Decision time interpretation
  let decisionLabel = "";
  let decisionColor = "";
  if (stats.avgDecisionTime === 0) {
    decisionLabel = "Pas encore de données";
    decisionColor = "text-slate-400";
  } else if (stats.avgDecisionTime <= 3) {
    decisionLabel = "Très rapide ⚡";
    decisionColor = "text-emerald-600";
  } else if (stats.avgDecisionTime <= 8) {
    decisionLabel = "Normal";
    decisionColor = "text-blue-600";
  } else {
    decisionLabel = "Lent — question peut-être confuse";
    decisionColor = "text-amber-600";
  }

  // Completion rate color
  let completionColor = "text-red-600";
  if (stats.completionRate >= 60) completionColor = "text-emerald-600";
  else if (stats.completionRate >= 30) completionColor = "text-amber-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-800 truncate">
                {data.capsuleTitle}
              </h3>
              <Link
                href={`/capsule/${identity.slug}`}
                target="_blank"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all shrink-0"
                title="Voir la capsule"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </Link>
              <Link
                href={`/dashboard/analytics/${data.capsuleId}`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all shrink-0"
                title="Analyse détaillée"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </Link>
            </div>
            <p className="mt-0.5 text-sm text-slate-400 truncate">
              {data.capsuleObjective}
            </p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
          >
            {expanded ? "Réduire" : "Détails"}
            <svg
              className={`h-3.5 w-3.5 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Visiteurs"
            value={stats.totalSessions}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            }
            color="from-violet-100 to-violet-50 border-violet-200"
          />
          <StatCard
            label="Complétion"
            value={stats.completionRate}
            suffix="%"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="from-emerald-100 to-emerald-50 border-emerald-200"
            subtext={`${stats.completedSessions} terminées`}
          />
          <StatCard
            label="Temps décision"
            value={stats.avgDecisionTime}
            suffix="s"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="from-blue-100 to-blue-50 border-blue-200"
            subtext={decisionLabel}
          />
          <StatCard
            label="Abandon"
            value={stats.abandonRate}
            suffix="%"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            }
            color="from-red-100 to-red-50 border-red-200"
            subtext={`${stats.abandonedSessions} abandonnées`}
          />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-6 py-6 space-y-8 bg-slate-50/50 animate-in">
          {/* Activity (last 30 days) */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Activité — 30 derniers jours
            </h4>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <ActivityChart sessionsByDay={data.sessionsByDay} />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-slate-400">Il y a 30j</span>
                <span className="text-[10px] text-slate-400">
                  Aujourd&apos;hui
                </span>
              </div>
            </div>
          </div>

          {/* Branch performance */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Performance par branche
            </h4>
            {data.branchPerformance.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                Pas encore de données — les stats apparaîtront quand les
                visiteurs interagiront avec la capsule.
              </p>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
                {/* Option clicks chart */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-3">
                    Clics sur les options
                  </p>
                  <MiniBarChart
                    data={data.branchPerformance.map((b, i) => ({
                      label: b.label,
                      value: b.clicks,
                      color: [
                        "bg-violet-500",
                        "bg-fuchsia-500",
                        "bg-indigo-500",
                        "bg-blue-500",
                        "bg-emerald-500",
                      ][i % 5],
                    }))}
                  />
                </div>

                {/* CTA clicks */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-medium text-slate-500 mb-3">
                    Clics sur les CTA (conversions)
                  </p>
                  <MiniBarChart
                    data={data.branchPerformance.map((b, i) => ({
                      label: b.label,
                      value: b.ctaClicks,
                      color: [
                        "bg-emerald-500",
                        "bg-teal-500",
                        "bg-green-500",
                        "bg-lime-500",
                        "bg-cyan-500",
                      ][i % 5],
                    }))}
                  />
                </div>

                {/* Table */}
                <div className="border-t border-slate-100 pt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase">
                        <th className="text-left pb-2">Option</th>
                        <th className="text-center pb-2">Clics</th>
                        <th className="text-center pb-2">CTA</th>
                        <th className="text-center pb-2">Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.branchPerformance.map((b) => {
                        const convRate =
                          b.clicks > 0
                            ? Math.round((b.ctaClicks / b.clicks) * 100)
                            : 0;
                        return (
                          <tr key={b.label}>
                            <td className="py-2 text-slate-700 font-medium">
                              {b.label}
                            </td>
                            <td className="py-2 text-center text-slate-500">
                              {b.clicks}
                            </td>
                            <td className="py-2 text-center text-slate-500">
                              {b.ctaClicks}
                            </td>
                            <td className="py-2 text-center">
                              <span
                                className={`font-semibold ${
                                  convRate >= 50
                                    ? "text-emerald-600"
                                    : convRate >= 20
                                    ? "text-amber-600"
                                    : "text-red-500"
                                }`}
                              >
                                {convRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Interpretation tips */}
          <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-500">
              Conseils d&apos;optimisation
            </h4>
            <ul className="text-xs text-violet-600 space-y-1.5 leading-relaxed">
              {stats.completionRate < 40 && stats.totalSessions > 5 && (
                <li>
                  ⚠️ <strong>Taux de complétion faible ({stats.completionRate}%)</strong> —
                  Simplifiez votre capsule ou rendez les options plus claires.
                </li>
              )}
              {stats.avgDecisionTime > 10 && (
                <li>
                  ⏳ <strong>Temps de décision élevé ({stats.avgDecisionTime}s)</strong> —
                  Les visiteurs hésitent. Reformulez votre question ou
                  simplifiez les options.
                </li>
              )}
              {stats.abandonRate > 50 && stats.totalSessions > 5 && (
                <li>
                  🚪 <strong>Taux d&apos;abandon élevé ({stats.abandonRate}%)</strong> —
                  Beaucoup de visiteurs quittent avant la fin. Vérifiez le
                  contenu des branches.
                </li>
              )}
              {stats.completionRate >= 60 && (
                <li>
                  ✅ <strong>Bon taux de complétion !</strong> — Votre capsule
                  fonctionne bien. Continuez à surveiller les performances.
                </li>
              )}
              {stats.totalSessions === 0 && (
                <li>
                  📊 Partagez le lien de votre capsule pour commencer à
                  collecter des données.
                </li>
              )}
            </ul>
          </div>

          {/* Link to detail page */}
          <div className="flex justify-center pt-2">
            <Link
              href={`/dashboard/analytics/${data.capsuleId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-violet-700 shadow-sm"
            >
              Voir l&apos;analyse complète
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [analytics, setAnalytics] = useState<
    { identityId: string; data: CapsuleAnalytics[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdentity, setSelectedIdentity] = useState<string>("ALL");

  async function fetchData() {
    try {
      const identRes = await fetch("/api/identity");
      if (identRes.status === 401) {
        router.push("/login");
        return;
      }
      const identData: Identity[] = await identRes.json();
      setIdentities(identData);

      // Fetch analytics for each identity
      const allAnalytics: { identityId: string; data: CapsuleAnalytics[] }[] =
        [];
      for (const ident of identData) {
        const res = await fetch(`/api/analytics?identityId=${ident.id}`);
        if (res.ok) {
          const data: CapsuleAnalytics[] = await res.json();
          allAnalytics.push({ identityId: ident.id, data });
        }
      }
      setAnalytics(allAnalytics);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggregate stats
  const allCapsuleData =
    selectedIdentity === "ALL"
      ? analytics.flatMap((a) => a.data)
      : analytics
          .filter((a) => a.identityId === selectedIdentity)
          .flatMap((a) => a.data);

  const totalVisitors = allCapsuleData.reduce(
    (acc, c) => acc + c.stats.totalSessions,
    0
  );
  const totalCompleted = allCapsuleData.reduce(
    (acc, c) => acc + c.stats.completedSessions,
    0
  );
  const globalCompletionRate =
    totalVisitors > 0 ? Math.round((totalCompleted / totalVisitors) * 100) : 0;
  const totalCtaClicks = allCapsuleData.reduce(
    (acc, c) => acc + c.stats.totalCtaClicks,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-8 w-8 animate-spin text-violet-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-slate-400">
            Chargement des analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Analysez le comportement des visiteurs de vos capsules
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-600 ring-1 ring-violet-200 transition-all hover:bg-violet-100"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
            />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Identity filter */}
      {identities.length > 1 && (
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 w-fit">
          <button
            onClick={() => setSelectedIdentity("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedIdentity === "ALL"
                ? "bg-violet-100 text-slate-800"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Toutes
          </button>
          {identities.map((id) => (
            <button
              key={id.id}
              onClick={() => setSelectedIdentity(id.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedIdentity === id.id
                  ? "bg-violet-100 text-slate-800"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {id.name}
            </button>
          ))}
        </div>
      )}

      {/* Global overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total visiteurs"
          value={totalVisitors}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          }
          color="from-violet-100 to-violet-50 border-violet-200"
        />
        <StatCard
          label="Complétion globale"
          value={globalCompletionRate}
          suffix="%"
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="from-emerald-100 to-emerald-50 border-emerald-200"
          subtext={`${totalCompleted} complétées`}
        />
        <StatCard
          label="Clics CTA"
          value={totalCtaClicks}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
              />
            </svg>
          }
          color="from-blue-100 to-blue-50 border-blue-200"
          subtext="Conversions totales"
        />
        <StatCard
          label="Capsules actives"
          value={allCapsuleData.length}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          }
          color="from-amber-100 to-amber-50 border-amber-200"
        />
      </div>

      {/* Empty state */}
      {allCapsuleData.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 ring-1 ring-violet-200 mb-5">
            <svg
              className="h-8 w-8 text-violet-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Pas encore de données
          </h3>
          <p className="mt-1 text-sm text-slate-400 max-w-sm text-center">
            Créez des capsules et partagez-les. Les analytics apparaîtront
            quand les visiteurs interagiront.
          </p>
          <Link
            href="/dashboard/capsules"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600/15 px-5 py-2.5 text-sm font-medium text-violet-600 ring-1 ring-violet-200 transition-all hover:bg-indigo-600/25"
          >
            Gérer mes capsules
          </Link>
        </div>
      )}

      {/* Per-capsule analytics */}
      {allCapsuleData.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Par capsule
          </h2>
          {allCapsuleData.map((capsuleData) => {
            const identityEntry = analytics.find((a) =>
              a.data.some((d) => d.capsuleId === capsuleData.capsuleId)
            );
            const identity = identities.find(
              (i) => i.id === identityEntry?.identityId
            );
            if (!identity) return null;
            return (
              <CapsuleAnalyticsCard
                key={capsuleData.capsuleId}
                data={capsuleData}
                identity={identity}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
