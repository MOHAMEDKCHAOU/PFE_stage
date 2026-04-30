"use client";

import { useMemo, useState } from "react";

export type JourneyGraphBranch = {
  headline: string;
  description: string;
  cta: string;
};

export type JourneyGraphOption = {
  id: string;
  label: string;
  branch: JourneyGraphBranch | null;
};

type CapsuleJourneyGraphProps = {
  identityName: string;
  capsuleTitle: string;
  objective: string;
  options: JourneyGraphOption[];
};

const VB_W = 800;
const VB_H = 440;

function truncate(str: string, max: number) {
  const t = str.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

const kindMeta = {
  Départ: { label: "Point d’entrée", bar: "from-rose-500 via-bordeaux-500 to-rose-600", emoji: "◎" },
  Chemin: { label: "Bifurcation", bar: "from-violet-500 to-fuchsia-500", emoji: "◇" },
  Option: { label: "Option", bar: "from-sky-500 to-cyan-400", emoji: "○" },
  Contenu: { label: "Destination", bar: "from-amber-400 to-orange-500", emoji: "→" },
} as const;

/**
 * Prévisualisation graphe du parcours capsule — rendu pro (SVG + panneau glass).
 */
export function CapsuleJourneyGraph({
  identityName,
  capsuleTitle,
  objective,
  options,
}: CapsuleJourneyGraphProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const layout = useMemo(() => {
    const n = Math.max(1, options.length);
    const root = { id: "root", x: VB_W / 2, y: 60, w: 236, h: 70 };
    const rowY = 178;
    const leafY = 312;
    const margin = 68;
    const usable = VB_W - 2 * margin;
    const gap = n <= 1 ? 0 : usable / (n - 1);
    const optNodes = options.map((opt, i) => {
      const x = n === 1 ? VB_W / 2 : margin + gap * i;
      return {
        ...opt,
        x,
        y: rowY,
        w: 136,
        h: 48,
        leafY,
      };
    });
    return { root, optNodes };
  }, [options]);

type JourneyKind = keyof typeof kindMeta;

  const hoverPayload = useMemo(() => {
    if (!hovered) return null;
    if (hovered === "root") {
      return {
        title: capsuleTitle,
        subtitle: identityName,
        body: objective,
        kind: "Départ" as JourneyKind,
      };
    }
    const opt = options.find((o) => o.id === hovered);
    if (opt) {
      return {
        title: opt.label,
        subtitle: "Choix",
        body: opt.branch ? truncate(opt.branch.description, 240) : "Branche à découvrir dans l’expérience interactive.",
        foot: opt.branch?.cta ? opt.branch.cta : undefined,
        kind: (opt.branch ? "Chemin" : "Option") as JourneyKind,
      };
    }
    const branchId = hovered.startsWith("leaf-") ? hovered.slice(5) : null;
    if (branchId) {
      const o = options.find((x) => x.id === branchId);
      if (o?.branch) {
        return {
          title: o.branch.headline,
          subtitle: "Action proposée",
          body: truncate(o.branch.description, 260),
          foot: o.branch.cta,
          kind: "Contenu" as JourneyKind,
        };
      }
    }
    return null;
  }, [hovered, options, capsuleTitle, identityName, objective]);

  const kindInfo = hoverPayload ? (kindMeta[hoverPayload.kind] ?? kindMeta.Option) : null;

  return (
    <div className="relative w-full">
      {/* Légende + repères */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-200/95">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgb(251,113,133)]" />
            Départ
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgb(167,139,250)]" />
            Choix
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgb(251,191,36)]" />
            Action
          </span>
        </div>
        <p className="text-[11px] font-medium text-zinc-500">
          Survolez une étape • <span className="text-zinc-400">{options.length}</span> parcours possibles
        </p>
      </div>

      {/* Carte SVG — cadre premium */}
      <div className="relative overflow-hidden rounded-2xl p-[1px] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.65),inset_0_1px_0_rgb(255,255,255,0.06)]">
        <div
          className="absolute inset-0 rounded-2xl opacity-90"
          style={{
            background:
              "linear-gradient(135deg, rgb(194 74 94 / 0.35) 0%, rgb(139 92 246 / 0.2) 46%, rgb(34 211 238 / 0.12) 100%)",
          }}
        />
        <div className="relative overflow-hidden rounded-[15px] bg-zinc-950/92 ring-1 ring-white/[0.06] backdrop-blur-xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="pointer-events-none absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-rose-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl" />

          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="relative z-[1] w-full h-auto block"
            role="img"
            aria-label={`Parcours interactif : ${capsuleTitle}, ${options.length} choix possibles`}
          >
            <defs>
              <linearGradient id="journey-edge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(236 72 153 / 0.55)" />
                <stop offset="50%" stopColor="rgb(167 139 250 / 0.5)" />
                <stop offset="100%" stopColor="rgb(34 211 238 / 0.45)" />
              </linearGradient>
              <linearGradient id="journey-edge-dim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(82 82 91 / 0.35)" />
                <stop offset="100%" stopColor="rgb(63 63 70 / 0.25)" />
              </linearGradient>
              <linearGradient id="node-root" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(63 24 38 / 0.95)" />
                <stop offset="100%" stopColor="rgb(24 24 27 / 0.98)" />
              </linearGradient>
              <linearGradient id="node-choice" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(49 46 129 / 0.6)" />
                <stop offset="100%" stopColor="rgb(24 24 27 / 0.97)" />
              </linearGradient>
              <linearGradient id="node-cta" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(120 53 15 / 0.55)" />
                <stop offset="100%" stopColor="rgb(24 24 27 / 0.96)" />
              </linearGradient>
              <filter id="journey-glow-root" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgb(0,0,0)" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* liens racine → options */}
            {layout.optNodes.map((opt) => {
              const sx = layout.root.x;
              const sy = layout.root.y + layout.root.h / 2;
              const tx = opt.x;
              const ty = opt.y - opt.h / 2;
              const mx = (sx + tx) / 2;
              const my = (sy + ty) / 2 + 28;
              const dim =
                hovered &&
                hovered !== "root" &&
                hovered !== opt.id &&
                !hovered.startsWith(`leaf-${opt.id}`);
              return (
                <path
                  key={`e-root-${opt.id}`}
                  d={`M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`}
                  fill="none"
                  stroke={dim ? "url(#journey-edge-dim)" : "url(#journey-edge)"}
                  strokeWidth={dim ? "1.5" : "2.25"}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                  opacity={dim ? 0.35 : 1}
                />
              );
            })}

            {/* liens option → feuille */}
            {layout.optNodes.map((opt) => {
              if (!opt.branch) return null;
              const sx = opt.x;
              const sy = opt.y + opt.h / 2;
              const tx = opt.x;
              const ty = opt.leafY - 30;
              const dim = hovered && hovered !== opt.id && hovered !== `leaf-${opt.id}`;
              return (
                <path
                  key={`e-leaf-${opt.id}`}
                  d={`M ${sx} ${sy} L ${tx} ${ty}`}
                  fill="none"
                  stroke={dim ? "url(#journey-edge-dim)" : "url(#journey-edge)"}
                  strokeWidth="1.75"
                  strokeDasharray="7 6"
                  strokeLinecap="round"
                  opacity={dim ? 0.3 : 0.88}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* nœud racine */}
            <g
              transform={`translate(${layout.root.x - layout.root.w / 2}, ${layout.root.y - layout.root.h / 2})`}
              onMouseEnter={() => setHovered("root")}
              onMouseLeave={() => setHovered(null)}
              className="cursor-default"
              filter="url(#node-shadow)"
            >
              <rect
                width={layout.root.w}
                height={layout.root.h}
                rx="16"
                fill="url(#node-root)"
                stroke={
                  hovered === "root" ? "rgb(244 114 182 / 0.85)" : "rgb(194 74 94 / 0.45)"
                }
                strokeWidth={hovered === "root" ? "2" : "1.25"}
                filter={hovered === "root" ? "url(#journey-glow-root)" : undefined}
              />
              <rect
                x="1"
                y="1"
                width={layout.root.w - 2}
                height={layout.root.h - 2}
                rx="15"
                fill="none"
                stroke="rgb(255 255 255 / 0.06)"
                strokeWidth="1"
              />
              <text x={layout.root.w / 2} y="24" textAnchor="middle" fill="#fda4af" fontSize="9" fontWeight="700" letterSpacing="0.14em">
                DÉPART
              </text>
              <text x={layout.root.w / 2} y="44" textAnchor="middle" fill="#fafafa" fontSize="13" fontWeight="700">
                {truncate(capsuleTitle, 30)}
              </text>
              <text x={layout.root.w / 2} y="62" textAnchor="middle" fill="#a1a1aa" fontSize="10" fontWeight="500">
                {truncate(objective, 42)}
              </text>
            </g>

            {/* nœuds options */}
            {layout.optNodes.map((opt) => (
              <g key={opt.id} filter="url(#node-shadow)">
                <g
                  transform={`translate(${opt.x - opt.w / 2}, ${opt.y - opt.h / 2})`}
                  onMouseEnter={() => setHovered(opt.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-default"
                >
                  <rect
                    width={opt.w}
                    height={opt.h}
                    rx="14"
                    fill="url(#node-choice)"
                    stroke={
                      hovered === opt.id || hovered === `leaf-${opt.id}`
                        ? "rgb(196 181 253 / 0.95)"
                        : "rgb(139 92 246 / 0.4)"
                    }
                    strokeWidth="1.5"
                  />
                  <rect
                    x="0.5"
                    y="0.5"
                    width={opt.w - 1}
                    height={opt.h - 1}
                    rx="13"
                    fill="none"
                    stroke="rgb(255 255 255 / 0.07)"
                  />
                  <text x={opt.w / 2} y="20" textAnchor="middle" fill="#ddd6fe" fontSize="9" fontWeight="700" letterSpacing="0.12em">
                    CHOIX
                  </text>
                  <text x={opt.w / 2} y="38" textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="600">
                    {truncate(opt.label, 20)}
                  </text>
                </g>

                {opt.branch && (
                  <g
                    transform={`translate(${opt.x - 66}, ${opt.leafY - 38})`}
                    onMouseEnter={() => setHovered(`leaf-${opt.id}`)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-default"
                    filter="url(#node-shadow)"
                  >
                    <rect
                      width="132"
                      height="56"
                      rx="14"
                      fill="url(#node-cta)"
                      stroke={
                        hovered === `leaf-${opt.id}`
                          ? "rgb(251 191 36 / 0.85)"
                          : "rgb(245 158 11 / 0.35)"
                      }
                      strokeWidth="1.35"
                    />
                    <text x="66" y="20" textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="700" letterSpacing="0.1em">
                      ACTION
                    </text>
                    <text x="66" y="40" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="600">
                      {truncate(opt.branch.headline, 24)}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Panneau détail — glass + accent */}
      <div
        className={`group/panel relative mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-zinc-950/95 p-4 shadow-lg shadow-black/40 transition-all duration-300 sm:p-5 ${
          hoverPayload ? "ring-1 ring-rose-500/15" : "ring-0 ring-transparent"
        }`}
      >
        {kindInfo && hoverPayload && (
          <div
            className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${kindInfo.bar} opacity-90`}
            aria-hidden
          />
        )}
        <div className={kindInfo ? "pl-3" : ""}>
          {hoverPayload && kindInfo ? (
            <>
              <div className="flex flex-wrap items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base shadow-inner"
                  aria-hidden
                >
                  {kindInfo.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={`rounded-lg bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${kindInfo.bar}`}
                    >
                      {hoverPayload.kind}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-500">{kindInfo.label}</span>
                  </div>
                  <h4 className="mt-1.5 text-base font-bold leading-snug text-white sm:text-lg">
                    {hoverPayload.title}
                  </h4>
                  {hoverPayload.subtitle && (
                    <p className="mt-0.5 text-xs font-medium text-zinc-500">{hoverPayload.subtitle}</p>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{hoverPayload.body}</p>
                  {hoverPayload.foot && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/30 px-3 py-2.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">CTA</span>
                      <p className="text-sm font-medium text-amber-100">{truncate(hoverPayload.foot, 120)}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-rose-500/20 to-violet-600/20 text-lg">
                🗺️
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">
                  Explorez la carte au survol
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  Chaque <strong className="font-semibold text-rose-300/90">départ</strong>,{" "}
                  <strong className="font-semibold text-violet-300/90">choix</strong> et{" "}
                  <strong className="font-semibold text-amber-200/90">action</strong> révèle le détail du parcours
                  narratif — sans lancer l’expérience.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
