"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  email: string;
  createdAt: string;
  identityProfiles: {
    id: string;
    name: string;
    slug: string;
    type: string;
    avatar: string | null;
    _count: {
      capsules: number;
      portfolioProjects: number;
    };
  }[];
  _count: { identityProfiles: number };
};

export default function AffiliateurClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    type: "FREELANCER",
  });
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  async function fetchClients() {
    try {
      const res = await fetch("/api/affiliateur/clients");
      if (res.status === 401) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setClients(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, [router]);

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setCreating(true);

    try {
      const res = await fetch("/api/affiliateur/clients", {
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
      setFormData({ name: "", email: "", password: "", type: "FREELANCER" });
      fetchClients();
    } catch {
      setFormError("Impossible de se connecter au serveur");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Gestion des Clients
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {clients.length} client{clients.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-amber-500/25 hover:bg-amber-600 transition-all duration-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Inviter un client
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Créer un nouveau client
          </h3>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Adresse email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@exemple.com"
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 caractères"
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Type de profil
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                >
                  <option value="FREELANCER">💼 Freelancer</option>
                  <option value="AGENCY">🏢 Agence</option>
                  <option value="CREATOR">🎨 Créateur</option>
                  <option value="STARTUP">🚀 Startup</option>
                </select>
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
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
              >
                {creating ? "Création..." : "Créer le client"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Aucun client pour le moment
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Commencez par inviter votre premier client
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            Inviter un client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {clients.map((client) => {
            const profile = client.identityProfiles[0];
            const totalCapsules = client.identityProfiles.reduce(
              (sum, p) => sum + p._count.capsules,
              0
            );
            return (
              <div
                key={client.id}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg shrink-0">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      (profile?.name || client.email)[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-800 truncate">
                      {profile?.name || client.email}
                    </h3>
                    <p className="text-sm text-slate-400">{client.email}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {profile?.type || "USER"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {client._count.identityProfiles} identité{client._count.identityProfiles !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-slate-400">
                        {totalCapsules} capsule{totalCapsules !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 shrink-0">
                    {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
