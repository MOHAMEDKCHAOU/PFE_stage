"use client";

import { useCallback, useEffect, useState } from "react";

export type StudioInviteInboxRow = {
  id: string;
  expiresAt: string;
  createdAt: string;
  affiliate: { email: string };
};

export function StudioInviteInbox({
  onAccepted,
}: {
  /** Appelé après une acceptation réussie (ex. recharger /api/me) */
  onAccepted?: () => void;
}) {
  const [items, setItems] = useState<StudioInviteInboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/studio/invites/inbox", { credentials: "include" });
      if (res.status === 401) {
        setItems([]);
        return;
      }
      const json = await res.json().catch(() => []);
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Impossible de charger les invitations.");
        setItems([]);
        return;
      }
      setItems(Array.isArray(json) ? json : []);
    } catch {
      setError("Impossible de charger les invitations.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function accept(id: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/studio/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ inviteId: id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Impossible d’accepter.");
        setBusyId(null);
        return;
      }
      await load();
      onAccepted?.();
    } catch {
      setError("Impossible d’accepter.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading || items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-bordeaux-200/80 bg-gradient-to-br from-bordeaux-900/[0.04] to-violet-50/60 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bordeaux-900 text-sm font-bold text-white">
          S
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Invitations Studio</h2>
          <p className="text-xs text-slate-500">
            Un partenaire vous invite à lier votre compte — vous pouvez accepter ici sans ouvrir un lien externe.
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 text-sm">
              <p className="font-medium text-slate-800">
                Studio : <span className="text-bordeaux-900">{row.affiliate.email}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Expire le {new Date(row.expiresAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => accept(row.id)}
              className="shrink-0 rounded-xl bg-bordeaux-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-bordeaux-900 disabled:opacity-50"
            >
              {busyId === row.id ? "Traitement…" : "Accepter dans l’app"}
            </button>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-3 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
