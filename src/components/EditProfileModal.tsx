"use client";

import { useState } from "react";

type Profile = {
  id: string;
  name: string;
  slug: string;
  type: string;
  bio: string | null;
  headline: string | null;
  avatar: string | null;
  cover: string | null;
};

const profileTypes = [
  { value: "FREELANCER", label: "Freelancer", icon: "💼" },
  { value: "AGENCY", label: "Agence", icon: "🏢" },
  { value: "CREATOR", label: "Créateur", icon: "🎨" },
  { value: "STARTUP", label: "Startup", icon: "🚀" },
];

export function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: profile.name,
    type: profile.type,
    headline: profile.headline || "",
    bio: profile.bio || "",
    avatar: profile.avatar || "",
    cover: profile.cover || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess(false);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Le nom est requis");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.id,
          name: form.name,
          type: form.type,
          headline: form.headline || null,
          bio: form.bio || null,
          avatar: form.avatar || null,
          cover: form.cover || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Erreur lors de la sauvegarde");
        return;
      }

      setSuccess(true);
      setTimeout(onSaved, 600);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/50 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Modifier le profil
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {profile.slug}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
              <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Profil mis à jour avec succès !
            </div>
          )}

          {/* Avatar preview + Name side by side */}
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
              {form.avatar ? (
                <img src={form.avatar} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                form.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              {/* Headline */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Titre / Headline</label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  placeholder="Ex: Développeur Full-Stack"
                  className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Type de profil</label>
            <div className="grid grid-cols-4 gap-2">
              {profileTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleChange("type", t.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all duration-200 active:scale-95 ${
                    form.type === t.value
                      ? "border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/30"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className={`text-[11px] font-medium ${form.type === t.value ? "text-indigo-300" : "text-zinc-500"}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={3}
              placeholder="Décrivez-vous en quelques mots..."
              className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none resize-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <p className="text-[11px] text-zinc-600">{form.bio.length}/300 caractères</p>
          </div>

          {/* Avatar URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">URL Avatar</label>
            <input
              type="url"
              value={form.avatar}
              onChange={(e) => handleChange("avatar", e.target.value)}
              placeholder="https://..."
              className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs"
            />
          </div>

          {/* Cover URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">URL Cover Image</label>
            <input
              type="url"
              value={form.cover}
              onChange={(e) => handleChange("cover", e.target.value)}
              placeholder="https://..."
              className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/[0.06] hover:border-white/[0.15]"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sauvegarde...
              </span>
            ) : (
              "Sauvegarder"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
