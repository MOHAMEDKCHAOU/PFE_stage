"use client";

import { useState, useEffect, useRef } from "react";

/* ───────── Types ───────── */
type Branch = {
  headline: string;
  description: string;
  cta: string;
  proof: string | null;
};

type Option = { id: string; label: string; branch: Branch | null };

type Capsule = {
  id: string;
  title: string;
  objective: string;
  options: Option[];
};

type Project = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  year: number | null;
};

type Testimonial = {
  id: string;
  author: string;
  content: string;
  role: string | null;
  company: string | null;
};

type CapsuleViewerProps = {
  identity: {
    name: string;
    headline: string | null;
    bio: string | null;
    avatar: string | null;
    cover: string | null;
    type: string;
  };
  capsules: Capsule[];
  projects: Project[];
  testimonials: Testimonial[];
};

const typeConfig: Record<string, { label: string; gradient: string; accent: string }> = {
  FREELANCER: { label: "Freelancer", gradient: "from-blue-600 to-cyan-500", accent: "text-cyan-400" },
  AGENCY: { label: "Agence", gradient: "from-violet-600 to-purple-500", accent: "text-violet-400" },
  CREATOR: { label: "Créateur", gradient: "from-pink-600 to-rose-500", accent: "text-pink-400" },
  STARTUP: { label: "Startup", gradient: "from-emerald-600 to-teal-500", accent: "text-emerald-400" },
};

/* ───────── Component ───────── */
export function CapsuleViewer({ identity, capsules, projects, testimonials }: CapsuleViewerProps) {
  const [activeCapsule, setActiveCapsule] = useState<Capsule>(capsules[0]);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const tc = typeConfig[identity.type] || typeConfig.FREELANCER;

  // Check favorites
  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : []))
      .then((favs) => {
        if (Array.isArray(favs)) {
          setIsFavorited(favs.some((f: { capsule: { id: string } }) => f.capsule.id === activeCapsule.id));
        }
      })
      .catch(() => {});
  }, [activeCapsule.id]);

  // Start analytics session
  useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "START", capsuleId: activeCapsule.id }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.sessionId) sessionIdRef.current = d.sessionId; })
      .catch(() => {});
  }, [activeCapsule.id]);

  function trackEvent(action: string, label?: string) {
    if (!sessionIdRef.current) return;
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, capsuleId: activeCapsule.id, sessionId: sessionIdRef.current, optionLabel: label }),
    }).catch(() => {});
  }

  async function toggleFavorite() {
    setFavLoading(true);
    if (isFavorited) {
      const r = await fetch(`/api/favorites?capsuleId=${activeCapsule.id}`, { method: "DELETE" });
      if (r.ok) setIsFavorited(false);
    } else {
      const r = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capsuleId: activeCapsule.id }),
      });
      if (r.ok || r.status === 409) setIsFavorited(true);
    }
    setFavLoading(false);
  }

  function handleSelect(option: Option) {
    if (selectedOption?.id === option.id) return handleBack();
    trackEvent("OPTION_CLICK", option.label);
    setIsTransitioning(true);
    setTimeout(() => { setSelectedOption(option); setIsTransitioning(false); }, 250);
  }

  function handleBack() {
    setIsTransitioning(true);
    setTimeout(() => { setSelectedOption(null); setIsTransitioning(false); }, 250);
  }

  function switchCapsule(c: Capsule) {
    if (c.id === activeCapsule.id) return;
    setSelectedOption(null);
    setActiveCapsule(c);
    sessionIdRef.current = null;
  }

  return (
    <div className="relative">
      {/* ──── Animated background ──── */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className={`absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br ${tc.gradient} opacity-[0.07] blur-[120px] animate-pulse`} />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 opacity-[0.05] blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%220.5%22%20fill%3D%22%23ffffff08%22%2F%3E%3C%2Fsvg%3E')] opacity-40" />
      </div>

      {/* ──── Hero Section ──── */}
      <section className="relative overflow-hidden">
        {/* Cover */}
        <div className="h-48 sm:h-64 relative">
          {identity.cover ? (
            <img src={identity.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${tc.gradient} opacity-30`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>

        {/* Profile info */}
        <div className="relative max-w-3xl mx-auto px-6 -mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div className={`relative h-28 w-28 rounded-2xl overflow-hidden ring-4 ring-zinc-950 shadow-2xl flex-shrink-0 ${!identity.avatar ? `bg-gradient-to-br ${tc.gradient}` : ""}`}>
              {identity.avatar ? (
                <img src={identity.avatar} alt={identity.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                  {identity.name[0]}
                </span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 text-center sm:text-left pb-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {identity.name}
                </h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${tc.accent}`}>
                  {tc.label}
                </span>
              </div>
              {identity.headline && (
                <p className="mt-1.5 text-sm text-zinc-400 max-w-md">{identity.headline}</p>
              )}
            </div>

            {/* Fav button */}
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={`group flex-shrink-0 rounded-xl p-3 transition-all duration-200 ${
                isFavorited
                  ? "bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30 hover:bg-pink-500/25"
                  : "bg-white/5 text-zinc-500 ring-1 ring-white/10 hover:text-pink-400 hover:ring-pink-500/30 hover:bg-pink-500/5"
              } disabled:opacity-50`}
              title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <svg className="h-5 w-5" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          {/* Bio */}
          {identity.bio && (
            <p className="mt-6 text-sm leading-relaxed text-zinc-400 max-w-2xl text-center sm:text-left">
              {identity.bio}
            </p>
          )}
        </div>
      </section>

      {/* ──── Capsule Tabs (multi-capsule) ──── */}
      {capsules.length > 1 && (
        <div className="max-w-3xl mx-auto px-6 mt-10">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {capsules.map((c) => (
              <button
                key={c.id}
                onClick={() => switchCapsule(c)}
                className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  c.id === activeCapsule.id
                    ? `bg-gradient-to-r ${tc.gradient} text-white shadow-lg shadow-indigo-500/20`
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white ring-1 ring-white/5"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ──── Active Capsule ──── */}
      <section className="max-w-3xl mx-auto px-6 mt-8">
        <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Glow line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Question */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-5">
              <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${tc.gradient} animate-pulse`} />
              <span className={`text-xs font-semibold uppercase tracking-widest ${tc.accent}`}>
                {activeCapsule.title}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {activeCapsule.objective}
            </h2>
          </div>

          {/* Content */}
          <div className={`px-8 pb-10 transition-all duration-250 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
            {!selectedOption ? (
              <div className="flex flex-col gap-3 mt-2">
                {activeCapsule.options.map((option, i) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className="group relative w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-5 text-left transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-black/20 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br ${tc.gradient} text-white text-sm font-bold shadow-lg`}>
                        {i + 1}
                      </span>
                      <span className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {option.label}
                      </span>
                      <svg className="ml-auto h-5 w-5 text-zinc-600 group-hover:text-white/60 transition-all group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2">
                {selectedOption.branch ? (
                  <div className="space-y-6">
                    {/* Selected pill */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium ${tc.accent}`}>
                        <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${tc.gradient}`} />
                        {selectedOption.label}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                      {selectedOption.branch.headline}
                    </h3>

                    <p className="text-zinc-400 leading-relaxed text-[15px]">
                      {selectedOption.branch.description}
                    </p>

                    {/* Proof */}
                    {selectedOption.branch.proof && (
                      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-5">
                        <div className="flex items-center gap-2 mb-2.5">
                          <svg className={`h-4 w-4 ${tc.accent}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`text-xs font-semibold uppercase tracking-widest ${tc.accent}`}>
                            Preuve
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {selectedOption.branch.proof}
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      onClick={() => trackEvent("CTA_CLICK", selectedOption!.label)}
                      className={`w-full rounded-2xl bg-gradient-to-r ${tc.gradient} px-6 py-4 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98]`}
                    >
                      {selectedOption.branch.cta}
                    </button>

                    {/* Back */}
                    <button onClick={handleBack} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mx-auto group">
                      <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                      Retour aux options
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-zinc-500">Pas encore de contenu pour cette option.</p>
                    <button onClick={handleBack} className="mt-4 text-sm text-zinc-500 hover:text-white transition-colors">
                      ← Retour aux options
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ──── Portfolio Section ──── */}
      {projects.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${tc.gradient}`} />
            <h2 className="text-lg font-bold text-white">Portfolio</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/15 transition-all">
                {p.image ? (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className={`aspect-[4/3] bg-gradient-to-br ${tc.gradient} opacity-20 flex items-center justify-center`}>
                    <span className="text-3xl opacity-60">📁</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white truncate">{p.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{p.description}</p>
                  {p.year && <span className="text-[10px] text-zinc-600 mt-2 block">{p.year}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ──── Testimonials Section ──── */}
      {testimonials.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${tc.gradient}`} />
            <h2 className="text-lg font-bold text-white">Témoignages</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/15 transition-all">
                <svg className={`h-5 w-5 ${tc.accent} mb-3 opacity-50`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
                </svg>
                <p className="text-sm text-zinc-300 leading-relaxed">{t.content}</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${tc.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.author}</p>
                    {(t.role || t.company) && (
                      <p className="text-[11px] text-zinc-500">
                        {t.role}{t.role && t.company ? " · " : ""}{t.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ──── Footer ──── */}
      <footer className="max-w-3xl mx-auto px-6 mt-20 mb-10 text-center">
        <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-6" />
        <p className="text-xs text-zinc-700">
          Propulsé par{" "}
          <span className={`font-semibold ${tc.accent}`}>Faymoos</span>
        </p>
      </footer>
    </div>
  );
}
