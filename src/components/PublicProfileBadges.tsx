"use client";

import Link from "next/link";
import type { PublicBadgeBundle, PublicBadgeDTO } from "@/lib/faymoos-badges";

const catStyle: Record<string, { bg: string; text: string; border: string }> = {
  EXPERTISE: { bg: "bg-sky-500/15", text: "text-sky-300", border: "border-sky-500/25" },
  CREDIBILITY: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/25" },
  IMPACT: { bg: "bg-violet-500/15", text: "text-violet-300", border: "border-violet-500/25" },
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div
      className="shrink-0 w-full sm:w-44"
      title={`Score Faymoos : ${score} / 100 — ${label}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold text-white tabular-nums">{score}</span>
        <span className="text-xs font-medium text-zinc-500">/ 100</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-zinc-900/10 overflow-hidden ring-1 ring-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">{label}</p>
    </div>
  );
}

function BadgePill({ b }: { b: PublicBadgeDTO }) {
  const st = catStyle[b.category] ?? catStyle.EXPERTISE;
  const date = new Date(b.verifiedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const tip = `${b.tier === "EXPERT" ? "⭐ Expert" : "✔ Vérifié"} — ${date}${b.evidence ? ` — ${b.evidence}` : ""}`;
  return (
    <div
      title={tip}
      className={`flex-shrink-0 rounded-2xl border px-3 py-2 ${st.bg} ${st.border} ${
        b.tier === "EXPERT" ? "shadow-[0_0_22px_-6px_rgba(139,92,246,0.55)]" : ""
      } transition-transform duration-200 hover:scale-[1.02]`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs select-none">{b.tier === "EXPERT" ? "⭐" : "✔"}</span>
        <span className={`text-xs font-semibold ${st.text}`}>{b.label}</span>
      </div>
    </div>
  );
}

export function PublicProfileBadges({
  identitySlug,
  bundle,
}: {
  identitySlug: string;
  bundle: PublicBadgeBundle;
}) {
  const { preview, all, score, scoreLabel, profileCompleteness } = bundle;
  const profilePercent = Math.min(100, Math.round((profileCompleteness / 40) * 100));

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/[0.03] backdrop-blur-sm px-4 py-4 sm:px-5">
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-4">
        <ScoreBar score={score} label={scoreLabel} />
        <div className="flex-1 min-w-0 border-t border-white/5 sm:border-t-0 sm:border-l sm:pl-4 pt-4 sm:pt-0">
          <div className="flex flex-wrap items-center gap-2 justify-between gap-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Badges Faymoos
            </p>
            <p className="text-[11px] text-zinc-500">Complétude profil ~{profilePercent}%</p>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {preview.length === 0 ? (
              <p className="text-xs text-zinc-500 leading-relaxed">
                Complétez votre profil, ajoutez des liens pro et publiez une capsule pour débloquer des badges.
              </p>
            ) : (
              preview.map((b) => <BadgePill key={b.id} b={b} />)
            )}
          </div>
          {all.length > 3 && (
            <Link
              href={`/capsule/${identitySlug}/badges`}
              className="mt-3 inline-flex text-xs font-semibold text-violet-300 hover:text-violet-200 underline-offset-4 hover:underline"
            >
              Voir tous les badges ({all.length})
            </Link>
          )}
          {all.length > 0 && all.length <= 3 && (
            <Link
              href={`/capsule/${identitySlug}/badges`}
              className="mt-3 inline-flex text-xs font-medium text-zinc-500 hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              Détails des badges
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
