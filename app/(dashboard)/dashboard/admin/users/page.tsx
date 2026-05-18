"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserProfile = {
  id: string;
  name: string;
  slug: string;
  type: string;
  avatar: string | null;
  _count: { capsules: number; portfolioProjects: number; testimonials: number };
};

type AdminUser = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { identityProfiles: number };
  identityProfiles: UserProfile[];
};

const typeColors: Record<string, string> = {
  FREELANCER: "bg-blue-100 text-blue-600",
  AGENCY: "bg-purple-100 text-purple-600",
  CREATOR: "bg-pink-100 text-pink-600",
  STARTUP: "bg-emerald-100 text-emerald-600",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchUsers() {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/admin/users${params}`);
    if (res.status === 403) {
      router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetchUsers();
  }

  async function setUserRole(userId: string, newRole: string) {
    setActionLoading(userId);
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de la modification");
    }
    setActionLoading(null);
  }

  async function handleDelete(userId: string) {
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
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
          <svg className="h-8 w-8 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
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
          <h1 className="text-2xl font-bold text-slate-800">Gestion des utilisateurs</h1>
          <p className="text-sm text-slate-500">{users.length} utilisateur{users.length > 1 ? "s" : ""} au total</p>
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
          placeholder="Rechercher par email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-zinc-900/45"
        />
        <button
          type="submit"
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          Rechercher
        </button>
      </form>

      {/* Users Table */}
      <div className="rounded-2xl bg-zinc-900/45 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Email</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Rôle</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Identités</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Inscrit le</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <Fragment key={user.id}>
                  <tr key={user.id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-700">{user.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-600"
                            : user.role === "AFFILIATE"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() =>
                          setExpandedUser(expandedUser === user.id ? null : user.id)
                        }
                        className="text-violet-600 hover:text-violet-700 font-medium text-xs flex items-center gap-1"
                      >
                        {user._count.identityProfiles} identité{user._count.identityProfiles > 1 ? "s" : ""}
                        <svg
                          className={`h-3 w-3 transition-transform ${
                            expandedUser === user.id ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <select
                          value={user.role}
                          disabled={actionLoading === user.id}
                          onChange={(e) => setUserRole(user.id, e.target.value)}
                          className="text-xs rounded-lg border border-slate-200 bg-zinc-900/45 px-2 py-1.5 font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 disabled:opacity-50"
                          title="Rôle"
                        >
                          <option value="USER">USER</option>
                          <option value="AFFILIATE">AFFILIATE (Studio)</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        {confirmDelete === user.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === user.id ? "..." : "Confirmer"}
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
                            onClick={() => setConfirmDelete(user.id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Expanded identity profiles */}
                  {expandedUser === user.id && user.identityProfiles.length > 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-3 bg-violet-50/30">
                        <div className="grid gap-3 md:grid-cols-2">
                          {user.identityProfiles.map((profile) => (
                            <div
                              key={profile.id}
                              className="flex items-center gap-3 rounded-xl bg-zinc-900/45 p-3 ring-1 ring-slate-100"
                            >
                              {profile.avatar ? (
                                <img
                                  src={profile.avatar}
                                  alt={profile.name}
                                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-bold text-sm">
                                  {profile.name[0]}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-slate-700 truncate">
                                    {profile.name}
                                  </p>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                      typeColors[profile.type] || "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {profile.type}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  /{profile.slug} · {profile._count.capsules} capsule{profile._count.capsules > 1 ? "s" : ""} · {profile._count.portfolioProjects} projet{profile._count.portfolioProjects > 1 ? "s" : ""} · {profile._count.testimonials} témoignage{profile._count.testimonials > 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Aucun utilisateur trouvé
          </div>
        )}
      </div>
    </div>
  );
}
