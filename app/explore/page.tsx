"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { parseTagsFromJson } from "@/lib/identity-profession";

type Identity = {
  id: string;
  name: string;
  slug: string;
  type: string;
  profession?: string | null;
  tags?: unknown;
  headline: string | null;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  theme: string | null;
  _count: { capsules: number; portfolioProjects: number; testimonials: number };
  capsules: { id: string; title: string; objective: string }[];
};

const typeFilters = [
  { value: "", label: "Tous", icon: "🌐" },
  { value: "FREELANCER", label: "Freelancers", icon: "💼" },
  { value: "AGENCY", label: "Agences", icon: "🏢" },
  { value: "CREATOR", label: "Créateurs", icon: "🎨" },
  { value: "STARTUP", label: "Startups", icon: "🚀" },
];

const typeConfig: Record<string, { gradient: string; badge: string; ring: string }> = {
  FREELANCER: { gradient: "from-blue-600 to-cyan-500", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20", ring: "ring-blue-500/30" },
  AGENCY: { gradient: "from-violet-600 to-purple-500", badge: "bg-violet-500/10 text-violet-400 border-violet-500/20", ring: "ring-violet-500/30" },
  CREATOR: { gradient: "from-pink-600 to-rose-500", badge: "bg-pink-500/10 text-pink-400 border-pink-500/20", ring: "ring-pink-500/30" },
  STARTUP: { gradient: "from-emerald-600 to-teal-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", ring: "ring-emerald-500/30" },
};

const exploreThemeOverrides: Record<string, { gradient: string }> = {
  ocean:    { gradient: "from-sky-500 to-cyan-500" },
  sunset:   { gradient: "from-orange-500 to-red-500" },
  forest:   { gradient: "from-green-500 to-teal-500" },
  berry:    { gradient: "from-pink-500 to-purple-500" },
  gold:     { gradient: "from-yellow-500 to-amber-500" },
  midnight: { gradient: "from-blue-500 to-indigo-500" },
  coral:    { gradient: "from-rose-400 to-pink-400" },
};

type IdentityWithReco = Identity & {
  _recommendation?: { reasons: string[]; personalized: boolean; score: number };
};

function ExploreProfileCard({ id, recoHint }: { id: Identity; recoHint?: string }) {
  const baseTc = typeConfig[id.type] || typeConfig.FREELANCER;
  const themeOv = id.theme ? exploreThemeOverrides[id.theme] : null;
  const tc = themeOv ? { ...baseTc, gradient: themeOv.gradient } : baseTc;
  const typeLabel = typeFilters.find((f) => f.value === id.type)?.label ?? id.type;
  const typeIcon = typeFilters.find((f) => f.value === id.type)?.icon ?? "✨";
  const tagList = parseTagsFromJson(id.tags);
  const visibleCapsules = id.capsules.slice(0, 2);
  const extraCapsules = Math.max(0, id.capsules.length - 2);

  return (
    <Link
      href={`/capsule/${id.slug}`}
      className={[
        "group relative flex flex-col overflow-hidden rounded-3xl",
        "border border-white/[0.08] bg-gradient-to-b from-zinc-900/75 via-zinc-950/85 to-[#07050d]",
        "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1.5 hover:border-violet-500/25",
        "hover:shadow-[0_24px_48px_-16px_rgba(124,58,237,0.18),0_0_0_1px_rgba(167,139,250,0.08)]",
      ].join(" ")}
    >
      {/* Subtle inner frame (Faymoos-style depth) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/35 to-transparent opacity-60" aria-hidden />

      <div className="relative h-[9.5rem] overflow-hidden sm:h-40">
        {id.cover ? (
          <img
            src={id.cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${tc.gradient}`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.12),transparent)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05030a] via-zinc-950/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />

        <span
          className={`absolute top-3.5 right-3.5 inline-flex max-w-[calc(100%-8rem)] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-md ${tc.badge}`}
        >
          <span className="text-[12px] leading-none opacity-90" aria-hidden>
            {typeIcon}
          </span>
          <span className="truncate">{typeLabel}</span>
        </span>

        {recoHint && (
          <span className="absolute left-3.5 top-3.5 max-w-[58%] truncate rounded-lg border border-violet-400/25 bg-violet-500/15 px-2.5 py-1 text-[10px] font-medium text-violet-100 shadow-lg shadow-violet-950/40 backdrop-blur-md">
            <span className="mr-1 text-violet-300/90" aria-hidden>
              ✦
            </span>
            {recoHint}
          </span>
        )}

        <div className="absolute -bottom-7 left-5 sm:-bottom-8 sm:left-6">
          <div
            className={`relative h-[3.75rem] w-[3.75rem] overflow-hidden rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.85)] ring-[3px] ring-[#0a0810] sm:h-16 sm:w-16 ${!id.avatar ? `bg-gradient-to-br ${tc.gradient}` : ""}`}
          >
            {id.avatar ? (
              <img src={id.avatar} alt={id.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
                {id.name[0]}
              </span>
            )}
            <div
              className={`pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ${tc.ring}`}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-10 sm:px-6 sm:pb-6 sm:pt-11">
        <div className="min-h-0 flex-1">
          <h3 className="truncate font-[family-name:var(--font-space-grotesk)] text-lg font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-violet-200">
            {id.name}
          </h3>
          {id.headline && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-zinc-400">{id.headline}</p>
          )}
          {id.profession?.trim() && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300/95">
              <span className="h-1 w-1 rounded-full bg-violet-400/80" aria-hidden />
              {id.profession.trim()}
            </p>
          )}
          {tagList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tagList.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-400 transition-colors group-hover:border-white/15 group-hover:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
              {tagList.length > 5 && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                  +{tagList.length - 5}
                </span>
              )}
            </div>
          )}

          {id.capsules.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">Capsules</p>
              <div className="flex flex-wrap gap-2">
                {visibleCapsules.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-violet-500/15 bg-violet-500/[0.07] px-2.5 py-1.5 text-[11px] font-medium text-zinc-300"
                  >
                    <span className="text-violet-400/90" aria-hidden>
                      ◆
                    </span>
                    <span className="truncate">{c.title}</span>
                  </span>
                ))}
                {extraCapsules > 0 && (
                  <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-zinc-500">
                    +{extraCapsules} autre{extraCapsules > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/[0.06] pt-4 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] px-2 py-0.5 text-zinc-400">
            <svg className="h-3.5 w-3.5 text-violet-400/80" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <span className="tabular-nums font-medium text-zinc-300">{id._count.capsules}</span>
            <span>capsule{id._count.capsules > 1 ? "s" : ""}</span>
          </span>
          {id._count.portfolioProjects > 0 && (
            <>
              <span className="hidden sm:inline text-zinc-700" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <span className="opacity-80" aria-hidden>
                  📁
                </span>
                <span className="font-medium text-zinc-300">{id._count.portfolioProjects}</span>
                <span>projet{id._count.portfolioProjects > 1 ? "s" : ""}</span>
              </span>
            </>
          )}
          {id._count.testimonials > 0 && (
            <>
              <span className="hidden sm:inline text-zinc-700" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <span className="opacity-80" aria-hidden>
                  💬
                </span>
                <span className="font-medium text-zinc-300">{id._count.testimonials}</span>
              </span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className={`h-px flex-1 rounded-full bg-gradient-to-r ${tc.gradient} opacity-50 transition-all duration-300 group-hover:opacity-100`} />
          <span className="shrink-0 text-[11px] font-semibold tracking-wide text-zinc-600 transition-colors duration-300 group-hover:text-violet-300">
            Voir le profil →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [forYou, setForYou] = useState<IdentityWithReco[]>([]);
  const [forYouLoading, setForYouLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchIdentities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (activeType) params.set("type", activeType);

      const res = await fetch(`/api/explore?${params}`);
      if (!res.ok) { setIdentities([]); return; }
      const data = await res.json();
      setIdentities(Array.isArray(data) ? data : []);
    } catch {
      setIdentities([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeType]);

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  useEffect(() => {
    let cancelled = false;
    setForYouLoading(true);
    fetch("/api/recommendations?limit=6", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setForYou(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setForYou([]);
      })
      .finally(() => {
        if (!cancelled) setForYouLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden text-foreground">
      {/* Fond plein écran, fixe : visible sur toute la fenêtre pendant tout le scroll */}
      <div
        className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh] w-full"
        aria-hidden
      >
        <Image
          src="/backround3.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={90}
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_18%,rgba(5,3,14,0.2),rgba(5,3,10,0.55))]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030208]/45 via-[#05030a]/62 to-[#05030a]/82" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_50%_50%,transparent_20%,rgba(3,2,10,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_45%_at_90%_18%,rgba(124,58,237,0.08),transparent_60%)]" />
      </div>

      <div className="relative z-10">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-1.5 mb-6 shadow-lg shadow-black/20 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse" />
            <span className="text-xs font-medium text-zinc-200">
              {identities.length} profil{identities.length > 1 ? "s" : ""} disponible{identities.length > 1 ? "s" : ""}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.4)] [text-shadow:0_2px_32px_rgba(0,0,0,0.35)]">
            Découvrez des{" "}
            <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
              talents uniques
            </span>
          </h1>
          <p className="mt-4 text-lg text-zinc-200/95 max-w-2xl mx-auto [text-shadow:0_1px_16px_rgba(0,0,0,0.45)]">
            Explorez les capsules de freelancers, agences, créateurs et startups.
            Trouvez le professionnel parfait pour votre projet.
          </p>

          {/* Search bar */}
          <div className="mt-10 max-w-xl mx-auto">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher par nom, compétence, mot-clé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/35 py-4 pl-12 pr-4 text-sm text-foreground shadow-lg shadow-black/20 backdrop-blur-md placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-white"
                  type="button"
                  aria-label="Effacer la recherche"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Type filters */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setActiveType(f.value)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeType === f.value
                    ? "bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white shadow-lg shadow-violet-900/35 ring-1 ring-white/15"
                    : "border border-white/12 bg-black/30 text-zinc-300 shadow-md backdrop-blur-md hover:border-white/25 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommandations hybrides */}
      {!forYouLoading && forYou.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 -mt-4 mb-10">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">
                Pour vous
              </h2>
              <p className="text-sm text-zinc-500">
                Sélection personnalisée (profil, favoris, tendances) — moteur de recommandation hybride
              </p>
            </div>
            <span className="shrink-0 self-start rounded-full border border-violet-400/25 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-medium text-violet-100 backdrop-blur-sm">
              Intelligence contextuelle
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {forYou.map((row) => (
              <ExploreProfileCard
                key={row.id}
                id={row}
                recoHint={
                  row._recommendation?.reasons[0] ??
                  (row._recommendation?.personalized
                    ? "Sélection pour vous"
                    : "Tendances")
                }
              />
            ))}
          </div>
        </div>
      )}

      {forYouLoading && (
        <div className="max-w-6xl mx-auto px-6 -mt-4 mb-10">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-800/40" />
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-white/10 bg-zinc-900/50 p-1">
                <div className="h-36 rounded-[1.25rem] bg-zinc-800/40" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-1/2 rounded bg-zinc-900/10" />
                  <div className="h-3 w-full rounded bg-zinc-900/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Catalogue
        </h2>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-white/10 bg-zinc-900/50 p-1">
                <div className="h-36 rounded-[1.25rem] bg-zinc-800/40" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-zinc-900/10" />
                  <div className="h-3 w-full rounded bg-zinc-900/10" />
                  <div className="h-3 w-1/2 rounded bg-zinc-900/10" />
                </div>
              </div>
            ))}
          </div>
        ) : identities.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto h-16 w-16 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-zinc-400">Aucun résultat</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Essayez avec d&apos;autres mots-clés ou changez les filtres.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {identities.map((id) => (
              <ExploreProfileCard key={id.id} id={id} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 py-8 text-center backdrop-blur-sm">
        <p className="text-xs text-zinc-500">
          Powered by{" "}
          <span className="font-semibold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Faymoos Platform
          </span>
        </p>
      </footer>
      </div>
    </div>
  );
}
