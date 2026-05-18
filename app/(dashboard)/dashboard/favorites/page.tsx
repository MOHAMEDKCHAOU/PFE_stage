"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FavoriteItem = {
  id: string;
  createdAt: string;
  capsule: {
    id: string;
    title: string;
    objective: string;
    identity: {
      name: string;
      slug: string;
      type: string;
      avatar: string | null;
    };
  };
};

const typeColors: Record<string, string> = {
  FREELANCER: "bg-blue-100 text-blue-600",
  AGENCY: "bg-purple-100 text-purple-600",
  CREATOR: "bg-pink-100 text-pink-600",
  STARTUP: "bg-emerald-100 text-emerald-600",
};

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return [];
        }
        return res.json();
      })
      .then((data) => Array.isArray(data) && setFavorites(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function removeFavorite(capsuleId: string) {
    setRemoving(capsuleId);
    const res = await fetch(`/api/favorites?capsuleId=${capsuleId}`, { method: "DELETE" });
    if (res.ok) {
      setFavorites((prev) => prev.filter((f) => f.capsule.id !== capsuleId));
    }
    setRemoving(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-pink-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mes Favoris</h1>
        <p className="text-sm text-slate-500">
          {favorites.length} capsule{favorites.length > 1 ? "s" : ""} sauvegardée{favorites.length > 1 ? "s" : ""}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="mt-4 text-slate-500 font-medium">Aucun favori pour le moment</p>
          <p className="mt-1 text-sm text-slate-400">
            Visitez des capsules et cliquez sur le bouton coeur pour les sauvegarder ici.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="group relative rounded-2xl bg-zinc-900/45 p-5 shadow-sm ring-1 ring-slate-100 hover:ring-pink-200 transition-all"
            >
              {/* Remove button */}
              <button
                onClick={() => removeFavorite(fav.capsule.id)}
                disabled={removing === fav.capsule.id}
                className="absolute top-4 right-4 rounded-full p-1.5 text-pink-400 hover:bg-pink-50 transition-colors disabled:opacity-50"
                title="Retirer des favoris"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>

              {/* Identity info */}
              <div className="flex items-center gap-3 mb-3">
                {fav.capsule.identity.avatar ? (
                  <img
                    src={fav.capsule.identity.avatar}
                    alt={fav.capsule.identity.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-bold text-sm">
                    {fav.capsule.identity.name[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-700">{fav.capsule.identity.name}</p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      typeColors[fav.capsule.identity.type] || "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {fav.capsule.identity.type}
                  </span>
                </div>
              </div>

              {/* Capsule info */}
              <h3 className="font-semibold text-slate-800 mb-1">{fav.capsule.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{fav.capsule.objective}</p>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Ajouté le {new Date(fav.createdAt).toLocaleDateString("fr-FR")}
                </p>
                <Link
                  href={`/capsule/${fav.capsule.identity.slug}`}
                  className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                >
                  Voir la capsule →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
