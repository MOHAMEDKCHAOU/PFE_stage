"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { EditProfileModal } from "@/components/EditProfileModal";

type IdentityProfile = {
  id: string;
  name: string;
  slug: string;
  type: string;
  bio: string | null;
  headline: string | null;
  avatar: string | null;
  cover: string | null;
  createdAt: string;
  portfolioProjects: { id: string; title: string; image: string | null }[];
  testimonials: { id: string; author: string }[];
  capsules: { id: string; title: string }[];
};

const typeLabels: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  FREELANCER: { label: "Freelancer", icon: "💼", color: "text-blue-400", bg: "bg-blue-500/15 ring-blue-500/20" },
  AGENCY: { label: "Agence", icon: "🏢", color: "text-purple-400", bg: "bg-purple-500/15 ring-purple-500/20" },
  CREATOR: { label: "Créateur", icon: "🎨", color: "text-pink-400", bg: "bg-pink-500/15 ring-pink-500/20" },
  STARTUP: { label: "Startup", icon: "🚀", color: "text-emerald-400", bg: "bg-emerald-500/15 ring-emerald-500/20" },
};

const profileTypeOptions = [
  { value: "FREELANCER", label: "Freelancer", icon: "💼", desc: "Professionnel indépendant" },
  { value: "AGENCY", label: "Agence", icon: "🏢", desc: "Équipe ou agence" },
  { value: "CREATOR", label: "Créateur", icon: "🎨", desc: "Créateur de contenu" },
  { value: "STARTUP", label: "Startup", icon: "🚀", desc: "Entreprise innovante" },
];

// ─── Create Identity Modal ──────────────────────────────
function CreateIdentityModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Le nom est requis");
      return;
    }
    if (!type) {
      setError("Choisissez un type de profil");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          headline: headline.trim() || null,
          bio: bio.trim() || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Erreur lors de la création");
        return;
      }

      onCreated();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/50 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Nouvelle identité</h3>
              <p className="text-xs text-zinc-500">Étape {step} sur 2</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Nom de l&apos;identité *</label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Ex: Studio Créatif, Mon Portfolio..."
                  className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ex: Développeur Full-Stack passionné"
                  className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Décrivez cette identité en quelques mots..."
                  className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none resize-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-400">Type de profil *</label>
              <div className="grid grid-cols-2 gap-3">
                {profileTypeOptions.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { setType(t.value); setError(""); }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-all duration-200 active:scale-[0.97] ${
                      type === t.value
                        ? "border-indigo-500/50 bg-indigo-500/10 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-3xl">{t.icon}</span>
                    <span className={`text-sm font-semibold ${type === t.value ? "text-indigo-300" : "text-zinc-300"}`}>
                      {t.label}
                    </span>
                    <span className="text-[11px] text-zinc-600">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
          <button
            onClick={() => step === 1 ? onClose() : setStep(1)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/[0.06]"
          >
            {step === 1 ? "Annuler" : "Retour"}
          </button>
          <button
            onClick={() => {
              if (step === 1) {
                if (!name.trim()) { setError("Le nom est requis"); return; }
                setError("");
                setStep(2);
              } else {
                handleCreate();
              }
            }}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Création...
              </span>
            ) : step === 1 ? "Suivant" : "Créer l'identité"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ─────────────────────────────────
function DeleteConfirmModal({
  profileName,
  onClose,
  onConfirm,
  deleting,
}: {
  profileName: string;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-zinc-900 p-6 shadow-2xl shadow-black/50 animate-in">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
            <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Supprimer cette identité ?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              L&apos;identité <span className="font-semibold text-white">{profileName}</span> et toutes ses données seront supprimées définitivement.
            </p>
          </div>
          <div className="flex w-full gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/[0.06]"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-500 active:scale-[0.98] disabled:opacity-60"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function IdentitiesPage() {
  const router = useRouter();
  const [identities, setIdentities] = useState<IdentityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProfile, setEditingProfile] = useState<IdentityProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<IdentityProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("ALL");

  async function fetchIdentities() {
    try {
      const res = await fetch("/api/identity");
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setIdentities(data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIdentities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete() {
    if (!deletingProfile) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/identity?id=${deletingProfile.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeletingProfile(null);
        fetchIdentities();
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }

  const filtered = filterType === "ALL"
    ? identities
    : identities.filter((p) => p.type === filterType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-zinc-500">Chargement des identités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mes Identités</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {identities.length} identité{identities.length !== 1 ? "s" : ""} professionnelle{identities.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl active:scale-[0.98]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvelle identité
        </button>
      </div>

      {/* Toolbar: filter + view mode */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type filter pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          <button
            onClick={() => setFilterType("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filterType === "ALL" ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Tous
          </button>
          {profileTypeOptions.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filterType === t.value ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="mr-1">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-1.5 transition-all ${viewMode === "grid" ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            title="Grille"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-1.5 transition-all ${viewMode === "list" ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            title="Liste"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20 mb-5">
            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">
            {filterType === "ALL" ? "Aucune identité" : "Aucune identité de ce type"}
          </h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-xs text-center">
            {filterType === "ALL"
              ? "Créez votre première identité professionnelle pour commencer."
              : "Essayez un autre filtre ou créez une nouvelle identité."}
          </p>
          {filterType === "ALL" && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600/15 px-5 py-2.5 text-sm font-medium text-indigo-400 ring-1 ring-indigo-500/20 transition-all hover:bg-indigo-600/25"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Créer ma première identité
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {filtered.length > 0 && viewMode === "grid" && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((profile) => {
            const typeInfo = typeLabels[profile.type] || typeLabels.FREELANCER;
            const isExpanded = expandedId === profile.id;
            const created = new Date(profile.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "short", year: "numeric",
            });

            return (
              <div
                key={profile.id}
                className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] overflow-hidden"
              >
                {/* Cover */}
                <div className="h-28 w-full relative">
                  {profile.cover ? (
                    <>
                      <img src={profile.cover} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/90" />
                    </>
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-transparent" />
                  )}

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingProfile(profile)}
                      className="rounded-lg bg-black/50 p-1.5 text-white/70 backdrop-blur-sm hover:bg-black/70 hover:text-white transition-all"
                      title="Modifier"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingProfile(profile)}
                      className="rounded-lg bg-black/50 p-1.5 text-red-400/70 backdrop-blur-sm hover:bg-red-600/30 hover:text-red-300 transition-all"
                      title="Supprimer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="relative flex flex-1 flex-col px-5 pb-5 -mt-7">
                  {/* Avatar */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/20 ring-4 ring-zinc-950 overflow-hidden">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                      profile.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <h3 className="mt-3 text-base font-semibold text-white">{profile.name}</h3>
                  {profile.headline && (
                    <p className="mt-0.5 text-sm text-zinc-500 line-clamp-1">{profile.headline}</p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${typeInfo.bg} ${typeInfo.color}`}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    <span className="text-[11px] text-zinc-600">{created}</span>
                  </div>

                  {profile.bio && (
                    <p className="mt-3 text-sm text-zinc-400 line-clamp-2 leading-relaxed">{profile.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{profile.portfolioProjects.length}</p>
                      <p className="text-[11px] text-zinc-600">Projets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{profile.capsules.length}</p>
                      <p className="text-[11px] text-zinc-600">Capsules</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{profile.testimonials.length}</p>
                      <p className="text-[11px] text-zinc-600">Avis</p>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                    className="mt-3 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
                  >
                    {isExpanded ? "Réduire" : "Voir les détails"}
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 space-y-4 border-t border-white/[0.04] pt-4 animate-in">
                      {/* Projects */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                          Projets ({profile.portfolioProjects.length})
                        </h4>
                        {profile.portfolioProjects.length === 0 ? (
                          <p className="text-xs text-zinc-600 italic">Aucun projet</p>
                        ) : (
                          <div className="space-y-1.5">
                            {profile.portfolioProjects.map((p) => (
                              <div key={p.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
                                {p.image ? (
                                  <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded bg-white/[0.04] text-zinc-600">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75" />
                                    </svg>
                                  </div>
                                )}
                                <span className="text-sm text-zinc-300 truncate">{p.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Capsules */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                          Capsules ({profile.capsules.length})
                        </h4>
                        {profile.capsules.length === 0 ? (
                          <p className="text-xs text-zinc-600 italic">Aucune capsule</p>
                        ) : (
                          <div className="space-y-1.5">
                            {profile.capsules.map((c) => (
                              <div key={c.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-500/10 text-violet-400">
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3" />
                                  </svg>
                                </div>
                                <span className="text-sm text-zinc-300 truncate">{c.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Testimonials */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                          Témoignages ({profile.testimonials.length})
                        </h4>
                        {profile.testimonials.length === 0 ? (
                          <p className="text-xs text-zinc-600 italic">Aucun témoignage</p>
                        ) : (
                          <div className="space-y-1.5">
                            {profile.testimonials.map((t) => (
                              <div key={t.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">
                                  {t.author.charAt(0)}
                                </div>
                                <span className="text-sm text-zinc-300 truncate">{t.author}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Slug link */}
                      <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
                        <svg className="h-4 w-4 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        <span className="text-xs text-zinc-500 font-mono truncate flex-1">
                          faymoos.com/capsule/{profile.slug}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/capsule/${profile.slug}`)}
                          className="rounded p-1 text-zinc-600 hover:text-indigo-400 transition-colors"
                          title="Copier le lien"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {filtered.length > 0 && viewMode === "list" && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Identité</th>
                <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Type</th>
                <th className="hidden md:table-cell px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Projets</th>
                <th className="hidden md:table-cell px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">Capsules</th>
                <th className="hidden lg:table-cell px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Créé le</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((profile) => {
                const typeInfo = typeLabels[profile.type] || typeLabels.FREELANCER;
                const created = new Date(profile.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "short", year: "numeric",
                });
                return (
                  <tr key={profile.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white overflow-hidden ring-2 ring-zinc-900">
                          {profile.avatar ? (
                            <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            profile.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{profile.name}</p>
                          {profile.headline && (
                            <p className="text-xs text-zinc-500 truncate">{profile.headline}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-5 py-4 text-center text-sm text-zinc-400">{profile.portfolioProjects.length}</td>
                    <td className="hidden md:table-cell px-5 py-4 text-center text-sm text-zinc-400">{profile.capsules.length}</td>
                    <td className="hidden lg:table-cell px-5 py-4 text-sm text-zinc-500">{created}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/capsule/${profile.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-indigo-400 transition-all"
                          title="Voir la capsule"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                        <button
                          onClick={() => setEditingProfile(profile)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-all"
                          title="Modifier"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingProfile(profile)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                          title="Supprimer"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateIdentityModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchIdentities();
          }}
        />
      )}

      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSaved={() => {
            setEditingProfile(null);
            fetchIdentities();
          }}
        />
      )}

      {deletingProfile && (
        <DeleteConfirmModal
          profileName={deletingProfile.name}
          onClose={() => setDeletingProfile(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}
