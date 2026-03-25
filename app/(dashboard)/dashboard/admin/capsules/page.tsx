"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminCapsule = {
  id: string;
  title: string;
  objective: string;
  createdAt: string;
  identity: {
    id: string;
    name: string;
    slug: string;
    type: string;
    user: { id: string; email: string };
  };
  _count: { options: number; sessions: number };
};

const typeColors: Record<string, string> = {
  FREELANCER: "bg-blue-100 text-blue-600",
  AGENCY: "bg-purple-100 text-purple-600",
  CREATOR: "bg-pink-100 text-pink-600",
  STARTUP: "bg-emerald-100 text-emerald-600",
};

export default function AdminCapsulesPage() {
  const router = useRouter();
  const [capsules, setCapsules] = useState<AdminCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedCapsule, setExpandedCapsule] = useState<string | null>(null);

  async function fetchCapsules() {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/admin/capsules${params}`);
    if (res.status === 403) {
      router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setCapsules(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCapsules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetchCapsules();
  }

  async function handleDelete(capsuleId: string) {
    setActionLoading(capsuleId);
    const res = await fetch(`/api/admin/capsules?id=${capsuleId}`, { method: "DELETE" });
    if (res.ok) {
      setCapsules((prev) => prev.filter((c) => c.id !== capsuleId));
      setConfirmDelete(null);
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de la suppression");
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-fuchsia-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des capsules</h1>
          <p className="text-sm text-slate-500">{capsules.length} capsule{capsules.length > 1 ? "s" : ""} au total</p>
        </div>
        <a
          href="/dashboard/admin"
          className="text-sm text-violet-600 hover:text-violet-700 font-medium"
        >
          ← Retour
        </a>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          placeholder="Rechercher par titre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-300 focus:border-fuchsia-400 bg-white"
        />
        <button
          type="submit"
          className="rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-fuchsia-700 transition-colors"
        >
          Rechercher
        </button>
      </form>

      {/* Capsules Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Capsule</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Propriétaire</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Identité</th>
                <th className="text-center px-5 py-3 font-medium text-slate-500">Options</th>
                <th className="text-center px-5 py-3 font-medium text-slate-500">Sessions</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Créée le</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {capsules.map((capsule) => (
                <Fragment key={capsule.id}>
                  <tr key={capsule.id} className="hover:bg-fuchsia-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <button
                          onClick={() =>
                            setExpandedCapsule(
                              expandedCapsule === capsule.id ? null : capsule.id
                            )
                          }
                          className="font-medium text-slate-700 hover:text-fuchsia-600 transition-colors text-left"
                        >
                          {capsule.title}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-500">{capsule.identity.user.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-medium">{capsule.identity.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            typeColors[capsule.identity.type] || "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {capsule.identity.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-violet-100 text-violet-600 text-xs font-medium">
                        {capsule._count.options}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-medium">
                        {capsule._count.sessions}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(capsule.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/capsule/${capsule.identity.slug}`}
                          target="_blank"
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Voir
                        </a>
                        {confirmDelete === capsule.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(capsule.id)}
                              disabled={actionLoading === capsule.id}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === capsule.id ? "..." : "Confirmer"}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-700"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(capsule.id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Expanded capsule details */}
                  {expandedCapsule === capsule.id && (
                    <tr>
                      <td colSpan={7} className="px-5 py-4 bg-fuchsia-50/30">
                        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
                          <p className="text-sm font-medium text-slate-600 mb-1">Objectif :</p>
                          <p className="text-sm text-slate-700">{capsule.objective}</p>
                          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                            <span>Slug : /{capsule.identity.slug}</span>
                            <span>ID : {capsule.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {capsules.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Aucune capsule trouvée
          </div>
        )}
      </div>
    </div>
  );
}
