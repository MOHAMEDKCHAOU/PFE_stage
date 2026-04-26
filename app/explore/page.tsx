"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

type Identity = {
  id: string;
  name: string;
  slug: string;
  type: string;
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

export default function ExplorePage() {
  const [identities, setIdentities] = useState<Identity[]>([]);
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

  return (
    <div className="min-h-screen bg-[#f4efe6] text-stone-900">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-28 pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-bordeaux-200/25 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-100/50 blur-[120px] animate-mesh" />
        </div>

        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-white/80 px-4 py-1.5 mb-6 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-stone-600">
              {identities.length} profil{identities.length > 1 ? "s" : ""} disponible{identities.length > 1 ? "s" : ""}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-900">
            Découvrez des{" "}
            <span className="bg-gradient-to-r from-bordeaux-800 via-rose-700 to-bordeaux-600 bg-clip-text text-transparent">
              talents uniques
            </span>
          </h1>
          <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">
            Explorez les capsules de freelancers, agences, créateurs et startups.
            Trouvez le professionnel parfait pour votre projet.
          </p>

          {/* Search bar */}
          <div className="mt-10 max-w-xl mx-auto">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher par nom, compétence, mot-clé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-stone-200/90 bg-white py-4 pl-12 pr-4 text-sm text-stone-800 shadow-sm placeholder:text-stone-400 focus:border-bordeaux-300 focus:outline-none focus:ring-2 focus:ring-bordeaux-200/50 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-bordeaux-800"
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
                onClick={() => setActiveType(f.value)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeType === f.value
                    ? "bg-gradient-to-r from-bordeaux-800 to-bordeaux-500 text-white shadow-md shadow-bordeaux-500/20"
                    : "border border-stone-200/90 bg-white text-stone-600 shadow-sm hover:border-bordeaux-200 hover:bg-bordeaux-50/50"
                }`}
              >
                <span>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-stone-200/80 bg-white p-1">
                <div className="h-32 rounded-xl bg-stone-200/60" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-stone-200" />
                  <div className="h-3 w-full rounded bg-stone-100" />
                  <div className="h-3 w-1/2 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        ) : identities.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto h-16 w-16 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-stone-600">Aucun résultat</h3>
            <p className="mt-1 text-sm text-stone-500">
              Essayez avec d&apos;autres mots-clés ou changez les filtres.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {identities.map((id) => {
              const baseTc = typeConfig[id.type] || typeConfig.FREELANCER;
              const themeOv = id.theme ? exploreThemeOverrides[id.theme] : null;
              const tc = themeOv ? { ...baseTc, gradient: themeOv.gradient } : baseTc;
              return (
                <Link
                  key={id.id}
                  href={`/capsule/${id.slug}`}
                  className="group overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-300 hover:border-bordeaux-200/60 hover:shadow-lg"
                >
                  {/* Cover */}
                  <div className="relative h-32 overflow-hidden">
                    {id.cover ? (
                      <img src={id.cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${tc.gradient} opacity-40`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent" />

                    {/* Type badge */}
                    <span className={`absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${tc.badge}`}>
                      {typeFilters.find((f) => f.value === id.type)?.icon} {id.type}
                    </span>

                    {/* Avatar overlapping */}
                    <div className="absolute -bottom-6 left-5">
                      <div className={`h-14 w-14 overflow-hidden rounded-xl shadow-xl ring-4 ring-white ${!id.avatar ? `bg-gradient-to-br ${tc.gradient}` : ""}`}>
                        {id.avatar ? (
                          <img src={id.avatar} alt={id.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                            {id.name[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-5 pt-9 pb-5">
                    <h3 className="truncate text-base font-bold text-stone-900 transition-colors group-hover:text-bordeaux-800">
                      {id.name}
                    </h3>
                    {id.headline && (
                      <p className="mt-1 line-clamp-1 text-xs text-stone-500">{id.headline}</p>
                    )}

                    {/* Capsules preview */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {id.capsules.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center rounded-lg border border-stone-200/80 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-600"
                        >
                          💊 {c.title}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-4 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                        </svg>
                        {id._count.capsules} capsule{id._count.capsules > 1 ? "s" : ""}
                      </span>
                      {id._count.portfolioProjects > 0 && (
                        <span className="flex items-center gap-1">
                          📁 {id._count.portfolioProjects} projet{id._count.portfolioProjects > 1 ? "s" : ""}
                        </span>
                      )}
                      {id._count.testimonials > 0 && (
                        <span className="flex items-center gap-1">
                          💬 {id._count.testimonials}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover glow */}
                  <div className={`h-0.5 w-full bg-gradient-to-r ${tc.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 py-8 text-center">
        <p className="text-xs text-stone-500">
          Propulsé par{" "}
          <span className="font-semibold bg-gradient-to-r from-bordeaux-800 to-bordeaux-500 bg-clip-text text-transparent">
            Faymoos
          </span>
        </p>
      </footer>
    </div>
  );
}
