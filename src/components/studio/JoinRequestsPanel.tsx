"use client";

import { useCallback, useEffect, useState } from "react";

type JoinRequestRow = {
  id: string;
  status: string;
  createdAt: string;
  client: { email: string; _count: { identityProfiles: number } };
};

async function fetchPendingRequests(): Promise<JoinRequestRow[] | null> {
  const res = await fetch("/api/studio/join-requests", { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return Array.isArray(json.pending) ? json.pending : [];
}

/**
 * Demandes de rattachement reçues via le QR partenaire. Masqué tant qu’il n’y a rien à valider.
 */
export function JoinRequestsPanel({ reloadKey = 0, onDecided }: { reloadKey?: number; onDecided?: () => void }) {
  const [pending, setPending] = useState<JoinRequestRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const rows = await fetchPendingRequests();
    if (rows) setPending(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPendingRequests().then((rows) => {
      if (!cancelled && rows) setPending(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function decide(row: JoinRequestRow, decision: "approve" | "decline") {
    if (
      decision === "approve" &&
      !window.confirm(`Valider la demande de ${row.client.email} ? Vous pourrez gérer son espace Faymoos.`)
    ) {
      return;
    }
    setBusyId(row.id);
    setNotice(null);
    const res = await fetch("/api/studio/join-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, decision }),
    });
    const json = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Erreur" });
      await load();
      return;
    }
    setNotice({
      kind: "success",
      text: decision === "approve" ? `${row.client.email} a rejoint vos clients.` : "Demande refusée.",
    });
    await load();
    onDecided?.();
  }

  if (pending.length === 0 && !notice) return null;

  return (
    <section
      aria-labelledby="studio-join-requests-title"
      className="rounded-3xl border border-[#C6A15B]/35 bg-[#C6A15B]/[.06] p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="studio-join-requests-title" className="font-semibold">
            Demandes à valider
          </h2>
          <p className="mt-0.5 text-xs text-white/50">Ces clients ont scanné votre QR code et demandent à vous rejoindre.</p>
        </div>
        {pending.length > 0 && (
          <span className="rounded-full bg-[#C6A15B] px-2.5 py-1 text-[11px] font-bold text-[#0B0D10]">{pending.length}</span>
        )}
      </div>

      {pending.length > 0 && (
        <ul className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D10]">
          {pending.map((row) => {
            const idents = row.client._count.identityProfiles;
            return (
              <li key={row.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.client.email}</p>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {idents} identité{idents > 1 ? "s" : ""} · via QR ·{" "}
                    {new Date(row.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => decide(row, "decline")}
                    className="rounded-xl px-3 py-2 text-xs font-medium text-white/50 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-45"
                  >
                    Refuser
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => decide(row, "approve")}
                    className="rounded-xl bg-[#C6A15B] px-4 py-2 text-xs font-semibold text-[#0B0D10] transition hover:brightness-110 disabled:opacity-45"
                  >
                    {busyId === row.id ? "…" : "Valider"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`mt-3 rounded-xl border p-3 text-xs ${
            notice.kind === "error"
              ? "border-red-400/25 bg-red-400/10 text-red-200"
              : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {notice.text}
        </p>
      )}
    </section>
  );
}
