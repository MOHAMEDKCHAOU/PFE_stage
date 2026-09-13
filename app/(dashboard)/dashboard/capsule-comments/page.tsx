"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CapsuleOption = {
  id: string;
  title: string;
  commentsEnabled: boolean;
  identityName: string;
  identitySlug: string;
};

type ModerateItem = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reply: { id: string; authorName: string; body: string; createdAt: string } | null;
};

function CapsuleCommentsModerationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCapsule = searchParams.get("capsuleId");

  const [capsules, setCapsules] = useState<CapsuleOption[]>([]);
  const [capsuleId, setCapsuleId] = useState<string>(initialCapsule ?? "");
  const [tab, setTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [items, setItems] = useState<ModerateItem[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [meta, setMeta] = useState<{ title: string; commentsEnabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [capsulesLoadError, setCapsulesLoadError] = useState<string | null>(null);

  const loadCapsules = useCallback(async () => {
    setCapsulesLoadError(null);
    try {
      const r = await fetch("/api/capsule-comments/my-capsules", { credentials: "include" });
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      const raw = await r.json().catch(() => ({}));
      let list: CapsuleOption[] = [];
      let primaryError: string | null = null;

      if (r.ok) {
        list = Array.isArray(raw.items) ? raw.items : [];
      } else {
        primaryError =
          typeof raw.error === "string" ? raw.error : `Erreur ${r.status} lors du chargement des capsules.`;
      }

      /* Repli : même périmètre que « Mes capsules » (/api/identity) si la route dédiée échoue ou renvoie vide à tort */
      if (list.length === 0) {
        const r2 = await fetch("/api/identity", { credentials: "include" });
        if (r2.ok) {
          const identities = (await r2.json().catch(() => null)) as
            | Array<{
                name: string;
                slug: string;
                capsules?: Array<{ id: string; title: string; commentsEnabled?: boolean }>;
              }>
            | null;
          if (Array.isArray(identities)) {
            list = identities.flatMap((idn) =>
              (idn.capsules ?? []).map((c) => ({
                id: c.id,
                title: c.title,
                commentsEnabled: c.commentsEnabled !== false,
                identityName: idn.name,
                identitySlug: idn.slug,
              })),
            );
            if (list.length > 0) primaryError = null;
          }
        }
      }

      setCapsulesLoadError(primaryError);
      setCapsules(list);
      setCapsuleId((prev) => prev || list[0]?.id || "");
    } catch {
      setCapsulesLoadError("Impossible de joindre le serveur ou réponse invalide.");
      setCapsules([]);
      setCapsuleId((prev) => prev || "");
    }
  }, [router]);

  const loadModeration = useCallback(async () => {
    if (!capsuleId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `/api/capsule-comments/moderate?capsuleId=${encodeURIComponent(capsuleId)}&status=${tab}`,
        { credentials: "include" },
      );
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      if (!r.ok) {
        setItems([]);
        setMeta(null);
        return;
      }
      const d = await r.json();
      setItems(d.items ?? []);
      setCounts(d.counts ?? { pending: 0, approved: 0, rejected: 0 });
      setMeta(d.capsule ? { title: d.capsule.title, commentsEnabled: d.capsule.commentsEnabled } : null);
    } finally {
      setLoading(false);
    }
  }, [capsuleId, tab, router]);

  useEffect(() => {
    void loadCapsules();
  }, [loadCapsules]);

  useEffect(() => {
    void loadModeration();
  }, [loadModeration]);

  async function setCommentsEnabled(next: boolean) {
    if (!capsuleId) return;
    const r = await fetch("/api/capsules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: capsuleId, commentsEnabled: next }),
    });
    if (r.ok) {
      setMeta((m) => (m ? { ...m, commentsEnabled: next } : null));
      setCapsules((c) => c.map((x) => (x.id === capsuleId ? { ...x, commentsEnabled: next } : x)));
    }
  }

  async function moderate(id: string, status: "APPROVED" | "REJECTED") {
    setBusyId(id);
    try {
      const r = await fetch("/api/capsule-comments/moderate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status }),
      });
      if (r.ok) void loadModeration();
    } finally {
      setBusyId(null);
    }
  }

  async function sendReply(item: ModerateItem) {
    if (!replyBody.trim()) return;
    setBusyId(item.id);
    try {
      const r = await fetch("/api/capsule-comments/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ parentCommentId: item.id, body: replyBody.trim() }),
      });
      if (r.ok) {
        setReplyOpen(null);
        setReplyBody("");
        void loadModeration();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Commentaires capsules</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Modération, réponses créateur et prévisualisation publique après validation.
          </p>
        </div>
        <a
          href="/api/capsule-comments/export"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-zinc-900/45 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-[#0B0D10]/5"
        >
          Exporter CSV
        </a>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/45 p-5 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Capsule
        </label>
        <select
          value={capsuleId}
          onChange={(e) => setCapsuleId(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/30 px-4 py-3 text-sm font-medium text-foreground focus:border-bordeaux-400 focus:outline-none focus:ring-2 focus:ring-bordeaux-200"
        >
          {capsules.length === 0 ? (
            <option value="">Aucune capsule</option>
          ) : (
            capsules.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} — {c.identityName}
              </option>
            ))
          )}
        </select>

        {capsulesLoadError && (
          <div className="mt-3 rounded-xl border border-[#C6A15B]/30 bg-[#C6A15B]/10 px-4 py-3 text-sm text-[#C6A15B]">
            <p className="font-medium">{capsulesLoadError}</p>
            <p className="mt-1 text-xs text-[#C6A15B]">
              Après ajout du module commentaires, exécutez{" "}
              <code className="rounded bg-[#C6A15B]/10 px-1 py-0.5">npx prisma migrate deploy</code> puis redémarrez le
              serveur. Vérifiez aussi que ce compte possède des capsules sur une identité (Mes capsules).
            </p>
          </div>
        )}

        {!capsulesLoadError && capsules.length === 0 && (
          <p className="mt-3 text-sm text-zinc-400">
            Aucune capsule pour ce compte. Créez-en une depuis{" "}
            <Link href="/dashboard/capsules" className="font-medium text-bordeaux-800 underline underline-offset-2">
              Mes capsules
            </Link>{" "}
            ou le Space Wizard.
          </p>
        )}

        {meta && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={meta.commentsEnabled}
                onChange={(e) => void setCommentsEnabled(e.target.checked)}
                className="rounded border-white/15 text-bordeaux-700 focus:ring-bordeaux-500"
              />
              Commentaires activés sur cette capsule
            </label>
            {capsules.find((c) => c.id === capsuleId) && (
              <a
                href={`/capsule/${capsules.find((c) => c.id === capsuleId)!.identitySlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-bordeaux-700 hover:underline"
              >
                Voir la page publique ↗
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
        {(
          [
            ["PENDING", "En attente", counts.pending],
            ["APPROVED", "Approuvés", counts.approved],
            ["REJECTED", "Rejetés", counts.rejected],
            ["ALL", "Tous", counts.pending + counts.approved + counts.rejected],
          ] as const
        ).map(([key, label, n]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
              tab === key
                ? "bg-zinc-900/45 border border-b-0 border-white/10 text-bordeaux-900 -mb-px"
                : "text-zinc-400 hover:text-foreground hover:bg-[#0B0D10]/5 rounded-lg"
            }`}
          >
            {label}
            <span
              className={`ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px] ${
                tab === key ? "bg-bordeaux-100 text-bordeaux-800" : "bg-zinc-900/10 text-zinc-400"
              }`}
            >
              {n}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-900/10 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-zinc-500 py-12 rounded-2xl border border-dashed border-white/10">
          Aucun commentaire dans cette catégorie.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/45 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{item.authorName}</p>
                  {item.authorEmail && (
                    <p className="text-xs text-zinc-500 mt-0.5">{item.authorEmail}</p>
                  )}
                  <time className="text-[11px] text-zinc-500 mt-1 block">
                    {new Date(item.createdAt).toLocaleString("fr-FR")}
                  </time>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${
                    item.status === "PENDING"
                      ? "bg-[#C6A15B]/15 text-[#C6A15B]"
                      : item.status === "APPROVED"
                        ? "bg-[#C6A15B]/10 text-[#C6A15B]"
                        : "bg-zinc-900/10 text-zinc-300"
                  }`}
                >
                  {item.status === "PENDING"
                    ? "En attente"
                    : item.status === "APPROVED"
                      ? "Approuvé"
                      : "Rejeté"}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{item.body}</p>

              {item.reply && (
                <div className="mt-4 rounded-xl border border-[#C6A15B]/80 bg-[#C6A15B]/60 p-4">
                  <p className="text-xs font-semibold text-[#C6A15B]">{item.reply.authorName}</p>
                  <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{item.reply.body}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {item.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void moderate(item.id, "APPROVED")}
                      className="rounded-xl bg-[#C6A15B] px-4 py-2 text-xs font-semibold text-[#0B0D10] hover:bg-[#C6A15B]/90 disabled:opacity-50"
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void moderate(item.id, "REJECTED")}
                      className="rounded-xl border border-white/15 bg-zinc-900/45 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-[#0B0D10]/5 disabled:opacity-50"
                    >
                      Rejeter
                    </button>
                  </>
                )}
                {item.status === "APPROVED" && !item.reply && (
                  <button
                    type="button"
                    onClick={() => setReplyOpen(replyOpen === item.id ? null : item.id)}
                    className="rounded-xl border border-bordeaux-200 bg-bordeaux-50 px-4 py-2 text-xs font-semibold text-bordeaux-900 hover:bg-bordeaux-100"
                  >
                    Répondre
                  </button>
                )}
              </div>

              {replyOpen === item.id && (
                <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Réponse visible publiquement sous le commentaire…"
                    className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm focus:border-bordeaux-400 focus:outline-none focus:ring-2 focus:ring-bordeaux-100"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void sendReply(item)}
                      className="rounded-xl bg-bordeaux-700 px-4 py-2 text-xs font-semibold text-white hover:bg-bordeaux-800 disabled:opacity-50"
                    >
                      Publier la réponse
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyOpen(null);
                        setReplyBody("");
                      }}
                      className="text-xs text-zinc-400 hover:text-foreground"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CapsuleCommentsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-zinc-500">Chargement…</div>
      }
    >
      <CapsuleCommentsModerationContent />
    </Suspense>
  );
}
