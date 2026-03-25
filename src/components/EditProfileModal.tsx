"use client";

import { useState, useRef } from "react";

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

function ImageUploadFrame({
  currentUrl,
  onUploaded,
  type,
  shape,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
  type: "avatar" | "cover";
  shape: "circle" | "banner";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [uploadError, setUploadError] = useState("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("Ce fichier n'est pas une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Max 5 Mo");
      return;
    }

    setUploadError("");
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setUploadError(json.error || "Erreur upload");
        setPreview(currentUrl);
        return;
      }

      setPreview(json.url);
      onUploaded(json.url);
    } catch {
      setUploadError("Erreur de connexion");
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (shape === "circle") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative h-24 w-24 cursor-pointer rounded-full overflow-hidden transition-all duration-200 group ${
            dragOver
              ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900"
              : "ring-4 ring-zinc-800 hover:ring-indigo-500/30"
          }`}
        >
          {preview ? (
            <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 text-3xl font-bold text-white">
              ?
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
        <p className="text-[11px] text-zinc-600">Cliquer ou glisser</p>
        {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}
      </div>
    );
  }

  // Banner shape
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-zinc-400">Image de couverture</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative h-32 w-full cursor-pointer rounded-xl overflow-hidden transition-all duration-200 group border ${
          dragOver
            ? "border-indigo-500 ring-2 ring-indigo-500/30"
            : "border-white/[0.06] border-dashed hover:border-indigo-500/30"
        }`}
      >
        {preview ? (
          <img src={preview} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white/[0.02]">
            <svg className="h-8 w-8 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-xs text-zinc-600">Cliquer ou glisser une image de couverture</p>
          </div>
        )}
        {preview && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Changer
              </div>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
      {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}
    </div>
  );
}

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

          {/* Cover image upload */}
          <ImageUploadFrame
            currentUrl={form.cover}
            onUploaded={(url) => handleChange("cover", url)}
            type="cover"
            shape="banner"
          />

          {/* Avatar + Name side by side */}
          <div className="flex items-start gap-5">
            <ImageUploadFrame
              currentUrl={form.avatar}
              onUploaded={(url) => handleChange("avatar", url)}
              type="avatar"
              shape="circle"
            />
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
