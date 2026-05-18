"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const steps = [
  {
    num: "01",
    title: "Créez votre identité",
    desc: "Choisissez votre type de profil, ajoutez votre photo, votre bio et votre headline.",
    icon: "👤",
    accent: "from-violet-600/30 to-fuchsia-600/20",
    ring: "ring-violet-500/35",
  },
  {
    num: "02",
    title: "Construisez votre capsule",
    desc: "Définissez des options interactives et des branches avec des CTAs personnalisés.",
    icon: "💊",
    accent: "from-amber-500/25 to-rose-600/20",
    ring: "ring-amber-400/30",
  },
  {
    num: "03",
    title: "Partagez votre lien",
    desc: "Un lien unique faymoos.com/capsule/votre-nom — partagez-le partout.",
    icon: "🔗",
    accent: "from-cyan-500/25 to-violet-600/25",
    ring: "ring-cyan-400/30",
  },
] as const;

const AUTO_MS = 7000;

function IllustrationIdentity() {
  return (
    <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-6 shadow-[0_24px_80px_-24px_rgba(124,58,237,0.35)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-3xl animate-pulse-glow" />
      <div className="relative flex animate-float-slow flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-3xl shadow-lg shadow-violet-900/50 ring-4 ring-white/10">
            👤
          </div>
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] shadow-lg ring-2 ring-zinc-900">
            ✓
          </span>
        </div>
        <div className="h-2 w-36 rounded-full bg-white/10" />
        <div className="mt-2 h-2 w-28 rounded-full bg-white/5" />
        <div className="mt-6 w-full space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">
            Headline
          </div>
          <div className="h-2 w-full rounded bg-violet-500/20" />
          <div className="h-2 w-4/5 rounded bg-white/10" />
          <div className="mt-3 flex gap-2">
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px] text-zinc-400">
              Bio
            </span>
            <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-200">
              Type
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function IllustrationCapsule() {
  return (
    <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 shadow-[0_24px_80px_-24px_rgba(245,158,11,0.2)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.12),transparent_50%)]" />
      <div className="relative flex h-full flex-col items-center justify-center gap-4">
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-center text-sm font-semibold text-violet-100 shadow-lg">
          Bienvenue 👋
        </div>
        <svg className="h-[100px] w-full max-w-[220px] text-violet-400/50" viewBox="0 0 220 100" fill="none" aria-hidden>
          <path
            d="M110 12v28M110 40 L60 72 M110 40 L160 72"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-pulse-glow"
          />
          <circle cx="110" cy="12" r="8" fill="rgba(167,139,250,0.4)" className="animate-pulse" />
          <circle cx="60" cy="78" r="10" fill="rgba(52,211,153,0.35)" />
          <circle cx="160" cy="78" r="10" fill="rgba(244,114,182,0.35)" />
          <circle cx="110" cy="92" r="8" fill="rgba(139,92,246,0.5)" />
        </svg>
        <div className="flex w-full max-w-[240px] justify-between gap-2 text-[10px]">
          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
            Option A
          </span>
          <span className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-rose-200">
            Option B
          </span>
        </div>
        <div className="flex gap-2">
          <span className="h-6 animate-bounce rounded-md bg-bordeaux-500/80 px-2 text-[10px] font-semibold leading-6 text-white [animation-duration:2s]">
            CTA
          </span>
          <span className="h-6 rounded-md border border-white/15 bg-white/5 px-2 text-[10px] font-medium leading-6 text-zinc-400">
            Suite →
          </span>
        </div>
      </div>
    </div>
  );
}

function IllustrationShare() {
  return (
    <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-[#0a0612] p-5 shadow-[0_24px_80px_-24px_rgba(34,211,238,0.15)]">
      <div className="pointer-events-none absolute -right-6 top-1/4 h-24 w-24 rounded-full bg-cyan-500/20 blur-2xl animate-mesh" />
      <div className="relative space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-sm">
          <span className="text-lg">🌐</span>
          <div className="min-w-0 flex-1 overflow-hidden text-left">
            <p className="truncate text-[11px] text-cyan-200/90">faymoos.com/capsule/</p>
            <p className="truncate font-mono text-[10px] text-zinc-500">votre-nom</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white shadow-md transition hover:bg-violet-500"
            tabIndex={-1}
          >
            Copier
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-3 py-4">
          {["✉️", "💼", "𝕏", "in"].map((glyph, i) => (
            <span
              key={glyph}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg shadow-inner transition-transform hover:scale-110"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {glyph === "in" ? (
                <span className="font-bold text-sky-400 text-sm">in</span>
              ) : (
                glyph
              )}
            </span>
          ))}
        </div>
        <div className="rounded-lg border border-dashed border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-center text-[10px] text-zinc-500">
          Partagez sur LinkedIn, portfolio, email signature…
        </div>
      </div>
    </div>
  );
}

const illustrations = [IllustrationIdentity, IllustrationCapsule, IllustrationShare] as const;

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPanel, setHoverPanel] = useState(false);

  const autoPaused = userPaused || hoverPanel;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pick = useCallback(
    (i: number) => {
      setActive(i);
      clearTimer();
      if (!userPaused) {
        timerRef.current = setInterval(() => {
          setActive((a) => (a + 1) % steps.length);
        }, AUTO_MS);
      }
    },
    [clearTimer, userPaused]
  );

  useEffect(() => {
    if (autoPaused) {
      clearTimer();
      return;
    }
    clearTimer();
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % steps.length);
    }, AUTO_MS);
    return clearTimer;
  }, [autoPaused, clearTimer]);

  const ActiveIllustration = illustrations[active];

  return (
    <section id="how-it-works" className="relative scroll-mt-24 border-t border-white/10 py-24 sm:py-32">
      <div className="pointer-events-none absolute left-0 top-1/3 h-[420px] w-[420px] -translate-x-1/3 rounded-full bg-violet-600/12 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] translate-x-1/4 rounded-full bg-amber-500/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-200 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
            </span>
            Parcours en 3 étapes
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Comment ça marche&nbsp;?
          </h2>
          <p className="mt-4 text-lg text-zinc-400 sm:text-xl">
            De la création à la conversion, en seulement trois étapes.
          </p>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Steps — interactive */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Cliquez une étape · lecture auto
            </p>
            {steps.map((step, i) => {
              const isOn = active === i;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => pick(i)}
                  className={`group relative w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                    isOn
                      ? `border-white/15 bg-gradient-to-br ${step.accent} shadow-[0_16px_50px_-20px_rgba(124,58,237,0.35)] ring-1 ${step.ring}`
                      : "border-white/8 bg-zinc-900/35 hover:border-white/15 hover:bg-zinc-900/55"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl transition-transform duration-300 ${
                        isOn
                          ? "border-white/20 bg-black/25 shadow-inner scale-105"
                          : "border-white/10 bg-black/20 group-hover:scale-105"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-[family-name:var(--font-space-grotesk)] text-xs font-bold uppercase tracking-wider ${isOn ? "text-violet-200" : "text-zinc-600"}`}
                        >
                          {step.num}
                        </span>
                        {isOn && (
                          <span className="rounded-full bg-violet-500/25 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                            Actif
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
              <input
                type="checkbox"
                className="rounded border-white/20 bg-zinc-900 text-violet-600 focus:ring-violet-500/40"
                checked={userPaused}
                onChange={(e) => {
                  setUserPaused(e.target.checked);
                  if (e.target.checked) clearTimer();
                }}
              />
              Pause la rotation automatique
            </label>
          </div>

          {/* Visual panel */}
          <div
            className="relative lg:col-span-7"
            onMouseEnter={() => setHoverPanel(true)}
            onMouseLeave={() => setHoverPanel(false)}
          >
            <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-600/15 via-transparent to-amber-500/10 blur-2xl" />
            <div className="relative min-h-[280px] sm:min-h-[340px] lg:min-h-[400px]">
              <div key={active} className="animate-scale-in">
                <ActiveIllustration />
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-zinc-600">
              Astuce : survolez ce panneau pour mettre en pause l’animation auto
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
