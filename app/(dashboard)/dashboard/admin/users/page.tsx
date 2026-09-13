"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  _count: { identityProfiles: number };
  identityProfiles: UserProfile[];
};

type RoleDefinition = {
  value: string;
  label: string;
  shortLabel: string;
  description: string;
  level: number;
};

type UsersPayload = {
  actor: { id: string; role: string; permissions: string[] };
  roles: RoleDefinition[];
  users: AdminUser[];
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [actor, setActor] = useState<UsersPayload["actor"] | null>(null);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const canWrite = Boolean(actor?.permissions.includes("admin:users:write"));
  const canDelete = Boolean(actor?.permissions.includes("admin:users:delete"));

  const roleByValue = useMemo(
    () => Object.fromEntries(roles.map((role) => [role.value, role])),
    [roles],
  );

  async function fetchUsers() {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/admin/users${params}`, { cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      router.push("/dashboard");
      return;
    }
    const data = (await res.json()) as UsersPayload;
    setUsers(Array.isArray(data.users) ? data.users : []);
    setActor(data.actor ?? null);
    setRoles(Array.isArray(data.roles) ? data.roles : []);
    setLoading(false);
  }

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetchUsers();
  }

  async function updateUser(userId: string, patch: { role?: string; status?: string }) {
    setNotice("");
    setActionLoading(userId);
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice(typeof data.error === "string" ? data.error : "Update failed.");
      setActionLoading(null);
      return;
    }
    setUsers((previous) =>
      previous.map((user) => (user.id === userId ? { ...user, ...data } : user)),
    );
    setNotice("Access updated.");
    setActionLoading(null);
  }

  async function handleDelete(userId: string) {
    setNotice("");
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice(typeof data.error === "string" ? data.error : "Deletion failed.");
      setActionLoading(null);
      return;
    }
    setUsers((previous) => previous.filter((user) => user.id !== userId));
    setConfirmDelete(null);
    setNotice("Account deleted.");
    setActionLoading(null);
  }

  function roleCanBeAssigned(role: string, user: AdminUser) {
    if (!canWrite) return false;
    if (actor?.role === "SUPER_ADMIN") return true;
    if (actor?.role !== "ADMIN") return false;
    if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) return false;
    return !["ADMIN", "SUPER_ADMIN"].includes(role);
  }

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#C6A15B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A15B]">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Users & roles</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
            Role changes and account suspensions are enforced by the API, recorded in the audit trail, and reflected in navigation automatically.
          </p>
        </div>
        <Link href="/dashboard/admin/access" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/68 transition hover:border-[#C6A15B]/50 hover:text-[#F7F4EE]">
          View access matrix
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-white/30">Accounts</p>
          <p className="mt-2 text-2xl font-semibold">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-white/30">Active</p>
          <p className="mt-2 text-2xl font-semibold text-[#C6A15B]">{users.filter((user) => user.status === "ACTIVE").length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-white/30">Suspended</p>
          <p className="mt-2 text-2xl font-semibold">{users.filter((user) => user.status === "SUSPENDED").length}</p>
        </div>
      </section>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="search"
          placeholder="Search by email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-[#F7F4EE] outline-none placeholder:text-white/25 focus:border-[#C6A15B]/55"
        />
        <button type="submit" className="rounded-xl bg-[#C6A15B] px-5 py-3 text-sm font-semibold text-[#0B0D10] transition hover:brightness-105">
          Search
        </button>
      </form>

      {notice && (
        <div className="rounded-xl border border-[#C6A15B]/25 bg-[#C6A15B]/8 px-4 py-3 text-sm text-[#F7F4EE]">{notice}</div>
      )}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="border-b border-white/10 bg-black/15 text-left text-xs uppercase tracking-[0.1em] text-white/30">
              <tr>
                <th className="px-5 py-4">Account</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Identities</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {users.map((user) => {
                const roleDefinition = roleByValue[user.role];
                const isSelf = actor?.id === user.id;
                const protectedForAdmin = actor?.role === "ADMIN" && ["ADMIN", "SUPER_ADMIN"].includes(user.role);
                return (
                  <Fragment key={user.id}>
                    <tr className="transition hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="font-medium text-[#F7F4EE]">{user.email}</div>
                        {isSelf && <div className="mt-1 text-[11px] text-[#C6A15B]">Current account</div>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-[#C6A15B]/25 bg-[#C6A15B]/8 px-2.5 py-1 text-xs font-medium text-[#C6A15B]">
                          {roleDefinition?.shortLabel ?? user.role}
                        </span>
                        <p className="mt-1.5 max-w-[230px] text-[11px] leading-4 text-white/32">{roleDefinition?.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${user.status === "ACTIVE" ? "border-[#C6A15B]/20 bg-[#C6A15B]/7 text-[#C6A15B]" : "border-white/10 bg-white/[0.035] text-white/45"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-[#C6A15B]" : "bg-white/30"}`} />
                          {user.status === "ACTIVE" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                          className="text-xs font-medium text-[#C6A15B] hover:underline"
                        >
                          {user._count.identityProfiles} identit{user._count.identityProfiles === 1 ? "y" : "ies"}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-white/42">{new Date(user.createdAt).toLocaleDateString("en-GB")}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={user.role}
                            disabled={!canWrite || isSelf || protectedForAdmin || actionLoading === user.id}
                            onChange={(event) => void updateUser(user.id, { role: event.target.value })}
                            className="rounded-lg border border-white/10 bg-[#0B0D10] px-2.5 py-2 text-xs text-white/72 outline-none focus:border-[#C6A15B]/55 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            {roles.map((role) => (
                              <option key={role.value} value={role.value} disabled={!roleCanBeAssigned(role.value, user)}>{role.shortLabel}</option>
                            ))}
                          </select>

                          <button
                            disabled={!canWrite || isSelf || protectedForAdmin || actionLoading === user.id}
                            onClick={() => void updateUser(user.id, { status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/58 transition hover:border-[#C6A15B]/40 hover:text-[#F7F4EE] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            {user.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                          </button>

                          {canDelete && !isSelf && (
                            confirmDelete === user.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => void handleDelete(user.id)} disabled={actionLoading === user.id} className="rounded-lg bg-[#C6A15B] px-3 py-2 text-xs font-semibold text-[#0B0D10] disabled:opacity-40">Confirm</button>
                                <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-white/10 px-2.5 py-2 text-xs text-white/45">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDelete(user.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/42 transition hover:border-[#C6A15B]/40 hover:text-[#F7F4EE]">Delete</button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedUser === user.id && (
                      <tr>
                        <td colSpan={6} className="bg-black/10 px-5 py-4">
                          {user.identityProfiles.length === 0 ? (
                            <p className="text-xs text-white/35">No identities.</p>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {user.identityProfiles.map((profile) => (
                                <div key={profile.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#C6A15B]/10 text-sm font-semibold text-[#C6A15B]">
                                      {profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : profile.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-[#F7F4EE]">{profile.name}</p>
                                      <p className="truncate text-xs text-white/32">/{profile.slug}</p>
                                    </div>
                                  </div>
                                  <div className="mt-3 text-xs text-white/42">{profile._count.capsules} capsules · {profile._count.portfolioProjects} projects · {profile._count.testimonials} testimonials</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && <div className="px-6 py-12 text-center text-sm text-white/35">No users found.</div>}
      </section>
    </div>
  );
}
