"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StudioClientRow = {
  id: string;
  affiliateUserId: string;
  clientUserId: string;
  createdAt: string;
  client: {
    id: string;
    email: string;
    createdAt: string;
    _count: { identityProfiles: number };
  };
};

export default function StudioPage() {
  const router = useRouter();
  const [links, setLinks] = useState<StudioClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [roleOk, setRoleOk] = useState<boolean | null>(null);

  async function load() {
    setError("");
    const res = await fetch("/api/studio/clients");
    if (res.status === 403) {
      setRoleOk(false);
      setLinks([]);
      setLoading(false);
      return;
    }
    if (res.status === 401) {
      setLoading(false);
      router.push("/login");
      return;
    }
    setRoleOk(true);
    const data = await res.json();
    setLinks(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/studio/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Erreur");
      setBusy(false);
      return;
    }
    setEmail("");
    await load();
    setBusy(false);
  }

  async function handleUnlink(clientUserId: string) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/studio/clients?clientUserId=${encodeURIComponent(clientUserId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(typeof json.error === "string" ? json.error : "Erreur");
    } else {
      await load();
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (roleOk === false) {
    return (
      <div className="max-w-lg space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-6 py-8 text-amber-950">
        <h1 className="text-xl font-bold">Studio</h1>
        <p className="text-sm text-amber-900/90">
          Cette page est réservée aux comptes <strong>Studio</strong> (rôle affilié). Un administrateur peut
          attribuer ce rôle depuis la page utilisateurs.
        </p>
        <a href="/dashboard" className="inline-block text-sm font-medium text-amber-800 underline underline-offset-2">
          Retour au tableau de bord
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Studio</h1>
        <p className="mt-1 text-sm text-stone-600">
          Liez des comptes clients (email Faymoos) pour créer et éditer leurs identités et capsules depuis votre
          session. Les clients doivent d’abord s’inscrire.
        </p>
      </div>

      <form onSubmit={handleLink} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-stone-500">Email du client</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
            className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-bordeaux-400 focus:ring-2 focus:ring-bordeaux-200"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="rounded-xl bg-bordeaux-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-bordeaux-900 disabled:opacity-50"
        >
          {busy ? "…" : "Lier le compte"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-stone-800">Clients liés ({links.length})</h2>
        </div>
        {links.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-stone-500">Aucun client lié pour l’instant.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {links.map((row) => (
              <li key={row.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-stone-800">{row.client.email}</p>
                  <p className="text-xs text-stone-500">
                    {row.client._count.identityProfiles} identité
                    {row.client._count.identityProfiles > 1 ? "s" : ""} · lié le{" "}
                    {new Date(row.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUnlink(row.clientUserId)}
                  className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                >
                  Retirer le lien
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
