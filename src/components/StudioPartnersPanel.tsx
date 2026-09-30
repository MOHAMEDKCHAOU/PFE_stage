"use client";

import { useCallback, useEffect, useState } from "react";

export type StudioPartnerRow = {
  affiliateUserId: string;
  affiliateEmail: string;
  linkedAt: string;
};

/**
 * Côté client : partenaires Studio ayant accès à mon compte, avec retrait du consentement.
 */
export function StudioPartnersPanel({
  reloadKey = 0,
  showWhenEmpty = false,
}: {
  /** Incrémenter pour recharger (ex. après acceptation d’une invitation) */
  reloadKey?: number;
  /** Afficher le panneau même sans partenaire (page Sécurité) */
  showWhenEmpty?: boolean;
}) {
  const [items, setItems] = useState<StudioPartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/studio/partners", { credentials: "include", cache: "no-store" });
      if (res.status === 401) {
        setItems([]);
        return;
      }
      const json = await res.json().catch(() => []);
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Impossible de charger les partenaires.");
        setItems([]);
        return;
      }
      setItems(Array.isArray(json) ? json : []);
    } catch {
      setError("Impossible de charger les partenaires.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  async function revoke(affiliateUserId: string) {
    setBusyId(affiliateUserId);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/studio/partners?affiliateUserId=${encodeURIComponent(affiliateUserId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Impossible de retirer l’accès.");
        return;
      }
      setNotice("Accès retiré. Ce partenaire ne peut plus gérer votre espace.");
      setConfirmId(null);
      await load();
    } catch {
      setError("Impossible de retirer l’accès.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading || (items.length === 0 && !showWhenEmpty && !notice)) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-accent-strong/90 to-card/90 p-5 shadow-lg shadow-black/30 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25">
          S
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Partenaires ayant accès à votre compte</h2>
          <p className="text-xs text-muted-foreground">
            Ces partenaires peuvent gérer vos identités, capsules et messages. Vous pouvez retirer leur accès à tout
            moment.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun partenaire n’a accès à votre compte.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((row) => (
            <li
              key={row.affiliateUserId}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card/70 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium text-foreground">
                  Partenaire : <span className="text-primary">{row.affiliateEmail}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Accès accordé le {new Date(row.linkedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {confirmId === row.affiliateUserId ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => setConfirmId(null)}
                    className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => revoke(row.affiliateUserId)}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {busyId === row.affiliateUserId ? "Retrait…" : "Confirmer le retrait"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => {
                    setNotice("");
                    setConfirmId(row.affiliateUserId);
                  }}
                  className="shrink-0 rounded-xl border border-red-500/40 px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  Retirer l’accès
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {notice ? <p className="mt-3 text-xs font-medium text-emerald-300">{notice}</p> : null}
      {error ? <p className="mt-3 text-xs font-medium text-[#C6A15B]">{error}</p> : null}
    </div>
  );
}
