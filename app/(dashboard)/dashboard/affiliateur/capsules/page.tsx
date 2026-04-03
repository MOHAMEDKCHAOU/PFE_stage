"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Capsule = {
  id: string;
  title: string;
  objective: string;
  createdAt: string;
  identity: {
    id: string;
    name: string;
    slug: string;
    user: { id: string; email: string };
  };
  options: {
    id: string;
    label: string;
    branch: { headline: string; cta: string } | null;
  }[];
  _count: { sessions: number; favorites: number };
};

type ClientIdentity = {
  id: string;
  name: string;
  slug: string;
  userId: string;
  userEmail: string;
};

export default function AffiliateurCapsulesPage() {
  const router = useRouter();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [identities, setIdentities] = useState<ClientIdentity[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    objective: "",
    identityId: "",
  });
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  async function fetchCapsules() {
    try {
      const res = await fetch("/api/affiliateur/capsules");
      if (res.status === 401) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setCapsules(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function fetchClientIdentities() {
    try {
      const res = await fetch("/api/affiliateur/clients");
      if (!res.ok) return;
      const clients = await res.json();
      const allIdentities: ClientIdentity[] = [];
      for (const client of clients) {
        for (const identity of client.identityProfiles) {
          allIdentities.push({
            id: identity.id,
            name: identity.name,
            slug: identity.slug,
            userId: client.id,
            userEmail: client.email,
          });
        }
      }
      setIdentities(allIdentities);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchCapsules();
    fetchClientIdentities();
  }, [router]);

  async function handleCreateCapsule(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setCreating(true);

    try {
      const res = await fetch("/api/affiliateur/capsules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        setFormError(json.error || "Erreur lors de la création");
        return;
      }

      setShowForm(false);
      setFormData({ title: "", objective: "", identityId: "" });
      fetchCapsules();
    } catch {
      setFormError("Impossible de se connecter au serveur");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Capsules Clients
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {capsules.length} capsule{capsules.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={identities.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:bg-violet-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Créer une capsule
        </button>
      </div>

      {identities.length === 0 && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">
            Vous devez d&apos;abord{" "}
            <Link href="/dashboard/affiliateur/clients" className="font-semibold underline">
              créer un client
            </Link>{" "}
            avant de pouvoir créer des capsules.
          </p>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Nouvelle capsule pour un client
          </h3>
          <form onSubmit={handleCreateCapsule} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Client / Identité
              </label>
              <select
                required
                value={formData.identityId}
                onChange={(e) => setFormData({ ...formData, identityId: e.target.value })}
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              >
                <option value="">Sélectionner une identité client</option>
                {identities.map((identity) => (
                  <option key={identity.id} value={identity.id}>
                    {identity.name} ({identity.userEmail})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Titre de la capsule
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Offre de services marketing"
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Objectif / Stratégie
                </label>
                <input
                  type="text"
                  required
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="Ex: Générer des leads qualifiés"
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
              >
                {creating ? "Création..." : "Créer la capsule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Capsules List */}
      {capsules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Aucune capsule client
          </h3>
          <p className="text-sm text-slate-400">
            Les capsules créées pour vos clients apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {capsules.map((capsule) => (
            <div
              key={capsule.id}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-800 truncate">
                    {capsule.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{capsule.objective}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                      👤 {capsule.identity.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {capsule.options.length} option{capsule.options.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-slate-400">
                      {capsule._count.sessions} session{capsule._count.sessions !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-slate-400">
                      {capsule._count.favorites} favori{capsule._count.favorites !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/capsule/${capsule.identity.slug}`}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Voir →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
