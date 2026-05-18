"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DefRow = {
  id: string;
  slug: string;
  label: string;
  description: string;
  category: string;
  sortOrder: number;
  assignedCount: number;
};

type UserBadgeRow = {
  id: string;
  slug: string;
  label: string;
  category: string;
  tier: string;
  source: string;
  evidence: string | null;
  verifiedAt: string;
};

type UserPayload = {
  user: { id: string; email: string; role: string; createdAt: string };
  identities: { id: string; name: string; slug: string }[];
  score: number;
  scoreLabel: string;
  breakdown: { completeness: number; badges: number; activity: number };
  badges: UserBadgeRow[];
};

const CAT_FR: Record<string, string> = {
  EXPERTISE: "Expertise",
  CREDIBILITY: "Crédibilité",
  IMPACT: "Impact",
};

const SOURCE_STYLE: Record<string, string> = {
  AUTO: "bg-slate-100 text-slate-700",
  EXTERNAL: "bg-amber-50 text-amber-800",
  ADMIN: "bg-violet-100 text-violet-800",
};

export default function AdminBadgesPage() {
  const router = useRouter();
  const [definitions, setDefinitions] = useState<DefRow[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [userData, setUserData] = useState<UserPayload | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  const [grantSlug, setGrantSlug] = useState("");
  const [grantTier, setGrantTier] = useState<"VERIFIED" | "EXPERT">("VERIFIED");
  const [busyAction, setBusyAction] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/badges", { credentials: "include" })
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          router.push("/dashboard");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.definitions) {
          setDefinitions(d.definitions);
          setTotalAssignments(d.totalAssignments ?? 0);
        }
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setCatalogLoading(false));
  }, [router]);

  useEffect(() => {
    if (definitions.length && !grantSlug) {
      setGrantSlug(definitions.find((x) => x.slug === "credibility_verified")?.slug ?? definitions[0]!.slug);
    }
  }, [definitions, grantSlug]);

  const loadUser = useCallback(
    async (opts?: { refreshAuto?: boolean }) => {
      if (!email.trim()) {
        setToast({ kind: "err", text: "Indiquez l’e-mail du compte." });
        return;
      }
      setUserLoading(true);
      setToast(null);
      try {
        const q = new URLSearchParams({ email: email.trim() });
        if (opts?.refreshAuto) q.set("refreshAuto", "1");
        const r = await fetch(`/api/admin/badges/user?${q}`, { credentials: "include" });
        const d = await r.json();
        if (!r.ok) throw new Error(typeof d.error === "string" ? d.error : "Erreur");
        setUserData(d as UserPayload);
      } catch (e) {
        setUserData(null);
        setToast({ kind: "err", text: e instanceof Error ? e.message : "Erreur" });
      } finally {
        setUserLoading(false);
      }
    },
    [email],
  );

  async function grantBadge() {
    if (!userData || !grantSlug) return;
    setBusyAction(true);
    setToast(null);
    try {
      const r = await fetch("/api/admin/badges/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: userData.user.id,
          badgeSlug: grantSlug,
          tier: grantTier,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(typeof d.error === "string" ? d.error : "Échec");
      setToast({ kind: "ok", text: "Badge attribué." });
      await loadUser();
    } catch (e) {
      setToast({ kind: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setBusyAction(false);
    }
  }

  async function revokeBadge(slug: string) {
    if (!userData) return;
    if (!confirm(`Retirer le badge « ${slug} » pour ${userData.user.email} ?`)) return;
    setBusyAction(true);
    setToast(null);
    try {
      const r = await fetch("/api/admin/badges/revoke", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: userData.user.id, badgeSlug: slug }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(typeof d.error === "string" ? d.error : "Échec");
      setToast({ kind: "ok", text: d.deleted ? "Badge retiré." : "Aucune ligne supprimée." });
      await loadUser();
    } catch (e) {
      setToast({ kind: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setBusyAction(false);
    }
  }

  if (catalogLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard/admin" className="hover:text-violet-600">
              Admin
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">Badges</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des badges</h1>
          <p className="mt-1 text-sm text-slate-600">
            Catalogue Faymoos, attribution manuelle (ex. Identité vérifiée) et retrait. Les badges{" "}
            <strong className="font-medium text-slate-800">AUTO</strong> peuvent être recalculés après une
            action sur le profil ou via « Recalculer les règles ».
          </p>
        </div>
        <div className="rounded-xl bg-zinc-900/45 px-4 py-3 shadow-sm ring-1 ring-slate-100 text-center sm:text-right">
          <p className="text-2xl font-bold text-slate-900">{totalAssignments}</p>
          <p className="text-xs text-slate-500 font-medium">attributions totales</p>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Catalogue */}
      <section className="rounded-2xl bg-zinc-900/45 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Catalogue des badges</h2>
          <p className="text-xs text-slate-500 mt-0.5">Slug technique pour l’API et les scripts.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Badge</th>
                <th className="px-5 py-3 font-semibold">Catégorie</th>
                <th className="px-5 py-3 font-semibold">Slug</th>
                <th className="px-5 py-3 font-semibold text-right">Attribué (×)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {definitions.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{d.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-md line-clamp-2">{d.description}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{CAT_FR[d.category] ?? d.category}</td>
                  <td className="px-5 py-3">
                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">{d.slug}</code>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-800">
                    {d.assignedCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Utilisateur */}
      <section className="rounded-2xl bg-zinc-900/45 shadow-sm ring-1 ring-slate-100 p-5 space-y-5">
        <h2 className="font-semibold text-slate-900">Utilisateur cible</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              E-mail du compte
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="creatif@exemple.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <button
            type="button"
            disabled={userLoading}
            onClick={() => void loadUser()}
            className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            {userLoading ? "Chargement…" : "Charger"}
          </button>
          <button
            type="button"
            disabled={userLoading || !email.trim()}
            onClick={() => void loadUser({ refreshAuto: true })}
            className="rounded-xl border border-slate-200 bg-zinc-900/45 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Recalculer les règles AUTO
          </button>
        </div>

        {userData && (
          <div className="border-t border-slate-100 pt-5 space-y-5">
            <div className="flex flex-wrap gap-4 items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{userData.user.email}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rôle {userData.user.role} · inscrit le{" "}
                  {new Date(userData.user.createdAt).toLocaleDateString("fr-FR")}
                </p>
                {userData.identities.length > 0 && (
                  <p className="text-xs text-slate-600 mt-2">
                    Identités :{" "}
                    {userData.identities.map((i) => (
                      <Link
                        key={i.id}
                        href={`/capsule/${i.slug}`}
                        className="text-violet-700 hover:underline mr-2"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {i.name}
                      </Link>
                    ))}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-gradient-to-br from-violet-50 to-sky-50 ring-1 ring-violet-100 px-4 py-3 text-right">
                <p className="text-xs text-slate-600">Score Faymoos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {userData.score}{" "}
                  <span className="text-sm font-normal text-slate-500">/ 100</span>
                </p>
                <p className="text-xs text-violet-800 font-medium mt-0.5">{userData.scoreLabel}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Profil {userData.breakdown.completeness} · Badges {userData.breakdown.badges} · Activité{" "}
                  {userData.breakdown.activity}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Badges actuels</h3>
              {userData.badges.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun badge sur ce compte.</p>
              ) : (
                <ul className="space-y-2">
                  {userData.badges.map((b) => (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-center gap-2 justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">
                          {b.tier === "EXPERT" ? "⭐" : "✔"} {b.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {CAT_FR[b.category] ?? b.category} ·{" "}
                          {new Date(b.verifiedAt).toLocaleString("fr-FR")}
                          {b.evidence ? ` · ${b.evidence}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${SOURCE_STYLE[b.source] ?? "bg-slate-100"}`}
                        >
                          {b.source}
                        </span>
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => void revokeBadge(b.slug)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          Retirer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Attribuer manuellement</h3>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Badge</label>
                  <select
                    value={grantSlug}
                    onChange={(e) => setGrantSlug(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-zinc-900/45 px-3 py-2 text-sm"
                  >
                    {definitions.map((d) => (
                      <option key={d.id} value={d.slug}>
                        {d.label} ({d.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Niveau</label>
                  <select
                    value={grantTier}
                    onChange={(e) => setGrantTier(e.target.value as "VERIFIED" | "EXPERT")}
                    className="w-full sm:w-40 rounded-lg border border-slate-200 bg-zinc-900/45 px-3 py-2 text-sm"
                  >
                    <option value="VERIFIED">Vérifié</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={() => void grantBadge()}
                  className="rounded-xl bg-violet-600 text-white px-5 py-2 text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
                >
                  Attribuer (ADMIN)
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                L’attribution admin remplace la ligne existante pour ce badge (y compris tier). Pour « Identité
                vérifiée », préférez le niveau Vérifié sauf cas exceptionnel.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
