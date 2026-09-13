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
  FREELANCER: "bg-[#C6A15B]/10 text-[#C6A15B]",
  AGENCY: "bg-[#C6A15B]/10 text-[#C6A15B]",
  CREATOR: "bg-[#C6A15B]/10 text-[#C6A15B]",
  STARTUP: "bg-[#C6A15B]/10 text-[#C6A15B]",
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
          <svg className="h-8 w-8 animate-spin text-[#C6A15B]" viewBox="0 0 24 24" fill="none">
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
          <h1 className="text-2xl font-bold text-[#F7F4EE]">Gestion des capsules</h1>
          <p className="text-sm text-white/48">{capsules.length} capsule{capsules.length > 1 ? "s" : ""} au total</p>
        </div>
        <a
          href="/dashboard/admin"
          className="text-sm text-[#C6A15B] hover:text-[#C6A15B] font-medium"
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
          className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/25 focus:border-[#C6A15B]/40 bg-zinc-900/45"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#C6A15B] px-5 py-2.5 text-sm font-medium text-[#0B0D10] hover:bg-[#C6A15B]/90 transition-colors"
        >
          Rechercher
        </button>
      </form>

      {/* Capsules Table */}
      <div className="rounded-2xl bg-zinc-900/45 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#0B0D10]/[0.035]/50">
                <th className="text-left px-5 py-3 font-medium text-white/48">Capsule</th>
                <th className="text-left px-5 py-3 font-medium text-white/48">Propriétaire</th>
                <th className="text-left px-5 py-3 font-medium text-white/48">Identité</th>
                <th className="text-center px-5 py-3 font-medium text-white/48">Options</th>
                <th className="text-center px-5 py-3 font-medium text-white/48">Sessions</th>
                <th className="text-left px-5 py-3 font-medium text-white/48">Créée le</th>
                <th className="text-right px-5 py-3 font-medium text-white/48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {capsules.map((capsule) => (
                <Fragment key={capsule.id}>
                  <tr key={capsule.id} className="hover:bg-[#C6A15B]/10 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <button
                          onClick={() =>
                            setExpandedCapsule(
                              expandedCapsule === capsule.id ? null : capsule.id
                            )
                          }
                          className="font-medium text-white/80 hover:text-[#C6A15B] transition-colors text-left"
                        >
                          {capsule.title}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-white/48">{capsule.identity.user.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white/80 font-medium">{capsule.identity.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            typeColors[capsule.identity.type] || "bg-[#0B0D10]/[0.055] text-white/48"
                          }`}
                        >
                          {capsule.identity.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#C6A15B]/15 text-[#C6A15B] text-xs font-medium">
                        {capsule._count.options}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1 rounded-full bg-[#C6A15B]/10 text-[#C6A15B] text-xs font-medium">
                        {capsule._count.sessions}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/48">
                      {new Date(capsule.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/capsule/${capsule.identity.slug}`}
                          target="_blank"
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-[#0B0D10]/[0.035] text-white/65 hover:bg-[#0B0D10]/[0.055] transition-colors"
                        >
                          Voir
                        </a>
                        {confirmDelete === capsule.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(capsule.id)}
                              disabled={actionLoading === capsule.id}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium bg-[#C6A15B] text-[#0B0D10] hover:bg-[#C6A15B]/90 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === capsule.id ? "..." : "Confirmer"}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs px-2 py-1.5 rounded-lg text-white/48 hover:text-white/80"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(capsule.id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-[#C6A15B]/10 text-[#C6A15B] hover:bg-[#C6A15B]/10 transition-colors"
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
                      <td colSpan={7} className="px-5 py-4 bg-[#C6A15B]/10">
                        <div className="rounded-xl bg-zinc-900/45 p-4 ring-1 ring-slate-100">
                          <p className="text-sm font-medium text-white/65 mb-1">Objectif :</p>
                          <p className="text-sm text-white/80">{capsule.objective}</p>
                          <div className="mt-3 flex items-center gap-4 text-xs text-white/35">
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
          <div className="text-center py-12 text-white/35 text-sm">
            Aucune capsule trouvée
          </div>
        )}
      </div>
    </div>
  );
}
