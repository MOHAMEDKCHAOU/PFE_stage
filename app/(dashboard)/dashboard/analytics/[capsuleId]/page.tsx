"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

// ─── Donut / Ring Chart ──────────────────────────────────
function DonutChart({
  value,
  label,
  color,
  size = 140,
}: {
  value: number;
  label: string;
  color: string;
  size?: number;
}) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="12"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-slate-800">{value}%</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

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
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {value}
            {suffix && <span className="text-base font-medium text-slate-500 ml-0.5">{suffix}</span>}
          </p>
          {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Large Activity Chart (30 days) ─────────────────────
function LargeActivityChart({ sessionsByDay }: { sessionsByDay: Record<string, number> }) {
  const today = new Date();
  const days: { date: string; count: number; dayLabel: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    days.push({ date: key, count: sessionsByDay[key] || 0, dayLabel });
  }
  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-40">
        {days.map((day) => (
          <div
            key={day.date}
            className="flex-1 rounded-t-md transition-all duration-300 cursor-default group relative"
            style={{
              height: `${Math.max((day.count / max) * 100, 3)}%`,
              backgroundColor: day.count > 0 ? "rgb(139, 92, 246)" : "rgb(241, 245, 249)",
            }}
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-slate-800 text-white text-[10px] rounded-lg px-2.5 py-1 whitespace-nowrap z-10">
              <span className="font-semibold">{day.count} session{day.count !== 1 ? "s" : ""}</span>
              <span className="text-slate-300">{day.dayLabel}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 px-1">
        <span className="text-[11px] text-slate-400">Il y a 30 jours</span>
        <span className="text-[11px] text-slate-400">Aujourd&apos;hui</span>
      </div>
    </div>
  );
}

// ─── Funnel Chart ────────────────────────────────────────
function FunnelChart({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const maxValue = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const widthPct = Math.max((step.value / maxValue) * 100, 8);
        const dropoff = i > 0 && steps[i - 1].value > 0
          ? Math.round(((steps[i - 1].value - step.value) / steps[i - 1].value) * 100)
          : null;
        return (
          <div key={step.label} className="relative">
            <div className="flex items-center gap-4">
              <div className="w-32 text-right">
                <p className="text-sm font-medium text-slate-700">{step.label}</p>
              </div>
              <div className="flex-1 relative">
                <div
                  className={`h-10 rounded-xl transition-all duration-700 flex items-center px-4 ${step.color}`}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="text-sm font-bold text-white">{step.value}</span>
                </div>
              </div>
              {dropoff !== null && dropoff > 0 && (
                <span className="text-xs text-red-400 font-medium w-16 text-right">
                  -{dropoff}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pie Chart (SVG) ─────────────────────────────────────
function PieChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <p className="text-sm text-slate-400 italic text-center py-8">Pas de données</p>;

  const size = 180;
  const center = size / 2;
  const radius = 70;
  let cumulativeAngle = 0;

  const slices = data.map((d) => {
    const angle = (d.value / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    const endAngle = cumulativeAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return { ...d, path, percentage: Math.round((d.value / total) * 100) };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0">
        {slices.map((slice) => (
          <path
            key={slice.label}
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
            className="transition-all duration-300 hover:opacity-80"
          />
        ))}
        <circle cx={center} cy={center} r="35" fill="white" />
      </svg>
      <div className="space-y-2 min-w-0">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="text-sm text-slate-600 truncate">{slice.label}</span>
            <span className="text-xs font-semibold text-slate-400 ml-auto">{slice.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar Chart (horizontal) ─────────────────────────────
function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-600 truncate">{item.label}</span>
            <span className="text-sm font-bold text-slate-700">{item.value}</span>
          </div>
          <div className="h-7 bg-slate-100 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-700"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Detail Page ────────────────────────────────────
export default function CapsuleAnalyticsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const capsuleId = params.capsuleId as string;

  const [data, setData] = useState<CapsuleAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Insights
  const [aiInsights, setAiInsights] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function fetchAiInsights() {
    if (!data) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analytics: data }),
      });
      if (res.ok) {
        const result = await res.json();
        setAiInsights(result.insights);
      }
    } catch {
      // ignore
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    async function fetchCapsuleAnalytics() {
      try {
        const res = await fetch(`/api/analytics?capsuleId=${encodeURIComponent(capsuleId)}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          router.push("/dashboard/analytics");
          return;
        }
        const arr: CapsuleAnalytics[] = await res.json();
        if (arr.length > 0) {
          setData(arr[0]);
        }
      } catch {
        router.push("/dashboard/analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchCapsuleAnalytics();
  }, [capsuleId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-400">Chargement de l&apos;analyse...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-lg font-semibold text-slate-800">Capsule introuvable</p>
        <Link href="/dashboard/analytics" className="mt-4 text-sm text-violet-600 hover:underline">
          ← Retour aux analytics
        </Link>
      </div>
    );
  }

  const { stats } = data;
  const COLORS = ["#8b5cf6", "#d946ef", "#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  // Funnel steps
  const funnelSteps = [
    { label: "Visiteurs", value: stats.totalSessions, color: "bg-violet-500" },
    { label: "Clics option", value: stats.totalOptionClicks, color: "bg-fuchsia-500" },
    { label: "Clics CTA", value: stats.totalCtaClicks, color: "bg-emerald-500" },
  ];

  // Conversion rate
  const overallConversion =
    stats.totalSessions > 0
      ? Math.round((stats.totalCtaClicks / stats.totalSessions) * 100)
      : 0;

  // Decision time interpretation
  let decisionLabel = "";
  let decisionIcon = "📊";
  if (stats.avgDecisionTime === 0) {
    decisionLabel = "Pas de données";
  } else if (stats.avgDecisionTime <= 3) {
    decisionLabel = "Très rapide — vos options sont claires";
    decisionIcon = "⚡";
  } else if (stats.avgDecisionTime <= 8) {
    decisionLabel = "Normal — bonne réactivité";
    decisionIcon = "👍";
  } else {
    decisionLabel = "Lent — les visiteurs hésitent";
    decisionIcon = "⏳";
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard/analytics"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-violet-600 transition-colors mb-4"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour aux analytics
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{data.capsuleTitle}</h1>
            <p className="mt-1 text-sm text-slate-400">{data.capsuleObjective}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 ring-1 ring-violet-200">
              {data.optionsCount} option{data.optionsCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Visiteurs"
          value={stats.totalSessions}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          color="from-violet-100 to-violet-50 border-violet-200"
        />
        <StatCard
          label="Complétion"
          value={stats.completionRate}
          suffix="%"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="from-emerald-100 to-emerald-50 border-emerald-200"
          subtext={`${stats.completedSessions} terminées`}
        />
        <StatCard
          label="Conversion CTA"
          value={overallConversion}
          suffix="%"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
            </svg>
          }
          color="from-blue-100 to-blue-50 border-blue-200"
          subtext={`${stats.totalCtaClicks} clics CTA`}
        />
        <StatCard
          label="Abandon"
          value={stats.abandonRate}
          suffix="%"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          }
          color="from-red-100 to-red-50 border-red-200"
          subtext={`${stats.abandonedSessions} abandonnées`}
        />
      </div>

      {/* Row: Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completion donut */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6 self-start">
            Taux de complétion
          </h3>
          <div className="relative">
            <DonutChart value={stats.completionRate} label="complétion" color="#10b981" />
          </div>
          <p className="mt-4 text-xs text-slate-400 text-center">
            {stats.completedSessions} sur {stats.totalSessions} visiteurs terminent la capsule
          </p>
        </div>

        {/* Conversion donut */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6 self-start">
            Taux de conversion
          </h3>
          <div className="relative">
            <DonutChart value={overallConversion} label="conversion" color="#8b5cf6" />
          </div>
          <p className="mt-4 text-xs text-slate-400 text-center">
            {stats.totalCtaClicks} clics CTA sur {stats.totalSessions} visiteurs
          </p>
        </div>

        {/* Decision time card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Temps de décision
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-4xl mb-2">{decisionIcon}</span>
            <p className="text-3xl font-bold text-slate-800">
              {stats.avgDecisionTime}<span className="text-lg font-medium text-slate-400 ml-1">s</span>
            </p>
            <p className="mt-2 text-sm text-slate-500 text-center">{decisionLabel}</p>
          </div>
        </div>
      </div>

      {/* Activity Chart (large) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
          Activité — 30 derniers jours
        </h3>
        <LargeActivityChart sessionsByDay={data.sessionsByDay} />
      </div>

      {/* Row: Funnel + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Entonnoir de conversion
          </h3>
          <FunnelChart steps={funnelSteps} />
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Conversion globale</span>
              <span className={`font-bold ${overallConversion >= 30 ? "text-emerald-600" : overallConversion >= 10 ? "text-amber-600" : "text-red-500"}`}>
                {overallConversion}%
              </span>
            </div>
          </div>
        </div>

        {/* Pie chart: branch distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Répartition par branche
          </h3>
          {data.branchPerformance.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">
              Pas encore de données de branches
            </p>
          ) : (
            <PieChart
              data={data.branchPerformance.map((b, i) => ({
                label: b.label,
                value: b.clicks,
                color: COLORS[i % COLORS.length],
              }))}
            />
          )}
        </div>
      </div>

      {/* Branch Performance Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
          Performance détaillée par branche
        </h3>
        {data.branchPerformance.length === 0 ? (
          <p className="text-sm text-slate-400 italic">
            Les données apparaîtront quand les visiteurs interagiront avec les options.
          </p>
        ) : (
          <div className="space-y-8">
            {/* Option clicks */}
            <div>
              <p className="text-sm font-medium text-slate-600 mb-4">Clics sur les options</p>
              <HorizontalBarChart
                data={data.branchPerformance.map((b, i) => ({
                  label: b.label,
                  value: b.clicks,
                  color: COLORS[i % COLORS.length],
                }))}
              />
            </div>

            {/* CTA clicks */}
            <div className="border-t border-slate-100 pt-6">
              <p className="text-sm font-medium text-slate-600 mb-4">Clics CTA par branche</p>
              <HorizontalBarChart
                data={data.branchPerformance.map((b, i) => ({
                  label: b.label,
                  value: b.ctaClicks,
                  color: COLORS[i % COLORS.length],
                }))}
              />
            </div>

            {/* Conversion table */}
            <div className="border-t border-slate-100 pt-6">
              <p className="text-sm font-medium text-slate-600 mb-4">Tableau de conversion</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase border-b border-slate-100">
                      <th className="text-left pb-3 font-semibold">Option</th>
                      <th className="text-center pb-3 font-semibold">Clics</th>
                      <th className="text-center pb-3 font-semibold">CTA</th>
                      <th className="text-center pb-3 font-semibold">Conversion</th>
                      <th className="text-center pb-3 font-semibold">Part du trafic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.branchPerformance.map((b, i) => {
                      const convRate = b.clicks > 0 ? Math.round((b.ctaClicks / b.clicks) * 100) : 0;
                      const trafficShare = stats.totalOptionClicks > 0
                        ? Math.round((b.clicks / stats.totalOptionClicks) * 100)
                        : 0;
                      return (
                        <tr key={b.label} className="hover:bg-slate-50/50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              />
                              <span className="text-slate-700 font-medium">{b.label}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center text-slate-500">{b.clicks}</td>
                          <td className="py-3 text-center text-slate-500">{b.ctaClicks}</td>
                          <td className="py-3 text-center">
                            <span className={`font-semibold ${convRate >= 50 ? "text-emerald-600" : convRate >= 20 ? "text-amber-600" : "text-red-500"}`}>
                              {convRate}%
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-slate-400">{trafficShare}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Insights IA
            </h3>
          </div>
          <button
            onClick={fetchAiInsights}
            disabled={aiLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
              aiLoading
                ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
            }`}
          >
            {aiLoading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyse en cours...
              </>
            ) : aiInsights ? (
              <>✨ Réanalyser</>
            ) : (
              <>✨ Analyser avec l&apos;IA</>
            )}
          </button>
        </div>

        {!aiInsights && !aiLoading && (
          <p className="text-sm text-indigo-400">
            Cliquez sur &quot;Analyser avec l&apos;IA&quot; pour obtenir des recommandations personnalisées basées sur vos données.
          </p>
        )}

        {aiInsights && (
          <ul className="space-y-3">
            {aiInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-white p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Optimization Tips */}
      <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-500">
          Conseils d&apos;optimisation
        </h3>
        <ul className="text-sm text-violet-600 space-y-2 leading-relaxed">
          {stats.totalSessions === 0 && (
            <li>📊 Partagez le lien de votre capsule pour commencer à collecter des données.</li>
          )}
          {stats.completionRate >= 60 && (
            <li>✅ <strong>Excellent taux de complétion ({stats.completionRate}%)</strong> — Votre capsule est bien structurée et engageante.</li>
          )}
          {stats.completionRate < 40 && stats.totalSessions > 5 && (
            <li>⚠️ <strong>Taux de complétion faible ({stats.completionRate}%)</strong> — Simplifiez votre capsule ou rendez les options plus claires pour améliorer l&apos;engagement.</li>
          )}
          {stats.avgDecisionTime > 10 && (
            <li>⏳ <strong>Temps de décision élevé ({stats.avgDecisionTime}s)</strong> — Les visiteurs hésitent. Reformulez votre question ou réduisez le nombre d&apos;options.</li>
          )}
          {stats.abandonRate > 50 && stats.totalSessions > 5 && (
            <li>🚪 <strong>Taux d&apos;abandon élevé ({stats.abandonRate}%)</strong> — Beaucoup de visiteurs quittent. Vérifiez le contenu de vos branches et les CTA.</li>
          )}
          {overallConversion >= 30 && (
            <li>🎯 <strong>Bonne conversion ({overallConversion}%)</strong> — Vos CTA sont efficaces. Continuez à monitorer.</li>
          )}
          {overallConversion < 10 && stats.totalSessions > 10 && (
            <li>🔴 <strong>Conversion très faible ({overallConversion}%)</strong> — Revoyez vos CTA : texte, positionnement, et pertinence du lien.</li>
          )}
          {data.branchPerformance.length > 0 && (() => {
            const topBranch = data.branchPerformance[0];
            const totalClicks = data.branchPerformance.reduce((sum, b) => sum + b.clicks, 0);
            const topShare = totalClicks > 0 ? Math.round((topBranch.clicks / totalClicks) * 100) : 0;
            return topShare > 70 ? (
              <li>📌 <strong>&quot;{topBranch.label}&quot; domine ({topShare}% des clics)</strong> — Les autres options sont peut-être moins attractives. Reformulez-les.</li>
            ) : null;
          })()}
        </ul>
      </div>
    </div>
  );
}
