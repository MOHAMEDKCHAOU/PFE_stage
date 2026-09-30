"use client";

/* eslint-disable @next/next/no-img-element -- Avatar / cover previews from upload API */

import { useState, useRef } from "react";
import { MediaPickerDialog } from "@/components/media/MediaPickerDialog";
import { parseTagsFromJson } from "@/lib/identity-profession";
import { identityThemePresets } from "@/lib/identity-themes";

type Profile = {
  id: string;
  name: string;
  slug: string;
  type: string;
  bio: string | null;
  headline: string | null;
  avatar: string | null;
  cover: string | null;
  theme: string | null;
  socialLinks: Record<string, string> | null;
  profession?: string | null;
  tags?: unknown;
  hideBranding?: boolean;
  ctaWebhookUrl?: string | null;
  ctaWebhookSecret?: string | null;
  hasCtaWebhookSecret?: boolean;
};

const socialPlatforms = [
  { key: "linkedin", label: "LinkedIn", icon: "in", placeholder: "https://linkedin.com/in/..." },
  { key: "github", label: "GitHub", icon: "GH", placeholder: "https://github.com/..." },
  { key: "twitter", label: "X / Twitter", icon: "𝕏", placeholder: "https://x.com/..." },
  { key: "dribbble", label: "Dribbble", icon: "Dr", placeholder: "https://dribbble.com/..." },
  { key: "website", label: "Site web", icon: "🌐", placeholder: "https://votresite.com" },
  { key: "behance", label: "Behance", icon: "Bē", placeholder: "https://behance.net/..." },
];

const profileTypes = [
  { value: "FREELANCER", label: "Freelancer", icon: "💼" },
  { value: "AGENCY", label: "Agences", icon: "🏢" },
  { value: "CREATOR", label: "Créateur", icon: "🎨" },
  { value: "STARTUP", label: "Startup", icon: "🚀" },
];

const themePresets = identityThemePresets.map((t) => ({
  value: t.id,
  label: t.label,
  from: t.from,
  to: t.to,
}));

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
  const [pickerOpen, setPickerOpen] = useState(false);

  const libraryPicker = (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="text-[11px] font-medium text-[#C6A15B] hover:underline"
      >
        Choisir dans la bibliothèque
      </button>
      <MediaPickerDialog
        open={pickerOpen}
        accept="image"
        uploadType={type}
        title={type === "avatar" ? "Photo de profil" : "Image de couverture"}
        onClose={() => setPickerOpen(false)}
        onSelect={([asset]) => {
          setPickerOpen(false);
          if (!asset) return;
          setUploadError("");
          setPreview(asset.url);
          onUploaded(asset.url);
        }}
      />
    </>
  );

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
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
              : "ring-4 ring-border hover:ring-primary/40"
          }`}
        >
          {preview ? (
            <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#C6A15B] to-[#C6A15B] text-3xl font-bold text-white">
              ?
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <p className="text-[11px] text-muted-foreground">Cliquer ou glisser</p>
        {libraryPicker}
        {uploadError && <p className="text-[11px] text-[#C6A15B]">{uploadError}</p>}
      </div>
    );
  }

  // Banner shape
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Image de couverture</label>
        {libraryPicker}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative h-32 w-full cursor-pointer rounded-xl overflow-hidden transition-all duration-200 group border ${
          dragOver
            ? "border-primary ring-2 ring-primary/35"
            : "border-border border-dashed hover:border-primary/45"
        }`}
      >
        {preview ? (
          <img src={preview} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface/80">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-xs text-muted-foreground">Cliquer ou glisser une image de couverture</p>
          </div>
        )}
        {preview && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
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
      {uploadError && <p className="text-[11px] text-[#C6A15B]">{uploadError}</p>}
    </div>
  );
}

export function EditProfileModal({
  profile,
  ownerCanHideBranding = false,
  onClose,
  onSaved,
}: {
  profile: Profile;
  /** Pro / Commercial / Commercial+ (plan effectif) du propriétaire de l’identité — pas du gestionnaire espace commercial. */
  ownerCanHideBranding?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: profile.name,
    type: profile.type,
    headline: profile.headline || "",
    bio: profile.bio || "",
    profession: profile.profession ?? "",
    tagsLine: parseTagsFromJson(profile.tags).join(", "),
    avatar: profile.avatar || "",
    cover: profile.cover || "",
    theme: profile.theme || "",
    hideBranding: ownerCanHideBranding ? (profile.hideBranding ?? false) : false,
    ctaWebhookUrl: profile.ctaWebhookUrl ?? "",
    ctaWebhookSecret: profile.ctaWebhookSecret ?? "",
  });
  const [ctaSecretDirty, setCtaSecretDirty] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    (profile.socialLinks as Record<string, string>) || {}
  );
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
      const body: Record<string, unknown> = {
        id: profile.id,
        name: form.name,
        type: form.type,
        headline: form.headline || null,
        bio: form.bio || null,
        avatar: form.avatar || null,
        cover: form.cover || null,
        theme: form.theme || null,
        profession: form.profession.trim() || null,
        tags: form.tagsLine.trim(),
        socialLinks: Object.fromEntries(
          Object.entries(socialLinks).filter(([, v]) => v.trim())
        ),
        hideBranding: ownerCanHideBranding ? form.hideBranding : false,
        ctaWebhookUrl: form.ctaWebhookUrl.trim() || null,
      };
      if (ctaSecretDirty) {
        body.ctaWebhookSecret = form.ctaWebhookSecret.trim()
          ? form.ctaWebhookSecret.trim()
          : null;
      }

      const res = await fetch("/api/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl shadow-black/50 backdrop-blur-xl animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Modifier le profil
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile.slug}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dash-btn-ghost rounded-lg p-2"
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
            <div className="flex items-center gap-2 rounded-xl border border-[#C6A15B]/30 bg-[#C6A15B]/10 px-4 py-3 text-sm text-[#C6A15B]">
              <svg className="h-4 w-4 shrink-0 text-[#C6A15B]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-[#C6A15B]/30 bg-[#C6A15B]/10 px-4 py-3 text-sm text-[#C6A15B]">
              <svg className="h-4 w-4 shrink-0 text-[#C6A15B]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
                <label className="text-xs font-medium text-muted-foreground">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="dash-input"
                />
              </div>
              {/* Headline */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Titre / Headline</label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  placeholder="Ex: Développeur Full-Stack"
                  className="dash-input"
                />
              </div>
            </div>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Type de profil</label>
            <div className="grid grid-cols-4 gap-2">
              {profileTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleChange("type", t.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all duration-200 active:scale-95 ${
                    form.type === t.value
                      ? "border-primary/55 bg-accent-strong ring-1 ring-primary/35"
                      : "border-border bg-card/60 hover:border-primary/35 hover:bg-accent"
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className={`text-[11px] font-medium ${form.type === t.value ? "text-primary" : "text-muted-foreground"}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Profession & tags */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-medium text-muted-foreground">Métier / domaine</label>
              <input
                type="text"
                list="faymoos-profession-suggestions"
                value={form.profession}
                onChange={(e) => handleChange("profession", e.target.value)}
                placeholder="Ex: Photographe, SaaS Founder…"
                className="dash-input"
              />
              <datalist id="faymoos-profession-suggestions">
                <option value="Photographer" />
                <option value="Musician" />
                <option value="Marketing Agency" />
                <option value="SaaS Founder" />
                <option value="Consultant" />
                <option value="UX Designer" />
              </datalist>
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-medium text-muted-foreground">Tags (optionnel)</label>
              <input
                type="text"
                value={form.tagsLine}
                onChange={(e) => handleChange("tagsLine", e.target.value)}
                placeholder="photo, booking, portfolio…"
                className="dash-input"
              />
              <p className="text-[11px] text-muted-foreground">Séparés par des virgules · max 20 tags</p>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={3}
              placeholder="Décrivez-vous en quelques mots..."
              className="dash-input resize-none"
            />
            <p className="text-[11px] text-muted-foreground">{form.bio.length}/300 caractères</p>
          </div>

          {/* Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Thème de couleur</label>
            <div className="grid grid-cols-4 gap-2">
              {themePresets.map((t) => (
                <button
                  key={t.value || "default"}
                  type="button"
                  onClick={() => handleChange("theme", t.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all duration-200 active:scale-95 ${
                    form.theme === t.value
                      ? "border-primary/55 bg-accent-strong ring-1 ring-primary/35"
                      : "border-border bg-card/60 hover:border-primary/35 hover:bg-accent"
                  }`}
                >
                  <div
                    className="h-8 w-8 rounded-full shadow-md ring-2 ring-white/10"
                    style={{
                      background: `linear-gradient(135deg, ${t.from} 0%, ${t.to} 100%)`,
                      boxShadow: `0 4px 14px -2px ${t.from}66`,
                    }}
                  />
                  <span className={`text-[10px] font-medium ${form.theme === t.value ? "text-primary" : "text-muted-foreground"}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Premium / intégrations */}
          <div className="space-y-3 rounded-xl border border-primary/25 bg-accent-strong/80 px-4 py-4">
            <p className="text-xs font-semibold text-foreground">Premium & intégrations</p>
            <label
              className={`flex items-start gap-3 ${ownerCanHideBranding ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}
            >
              <input
                type="checkbox"
                checked={form.hideBranding}
                disabled={!ownerCanHideBranding}
                onChange={(e) => {
                  if (!ownerCanHideBranding) return;
                  setForm((prev) => ({ ...prev, hideBranding: e.target.checked }));
                  setError("");
                  setSuccess(false);
                }}
                className="mt-1 rounded border-border bg-card text-primary focus:ring-primary disabled:opacity-50"
              />
              <span className="text-sm text-foreground">
                White-label : masquer le pied de page « Powered by Faymoos Platform » sur la capsule publique
                {!ownerCanHideBranding && (
                  <>
                    {" "}
                    <span className="block mt-1 text-[11px] text-muted-foreground">
                      Disponible avec un abonnement{" "}
                      <a href="/dashboard/billing" className="text-primary underline underline-offset-2 hover:text-[var(--primary-hover)]">
                        Pro, Commercial ou Commercial+
                      </a>
                      .
                    </span>
                  </>
                )}
              </span>
            </label>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Webhook CTA (HTTPS, Zapier / Make)</label>
              <input
                type="url"
                value={form.ctaWebhookUrl}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, ctaWebhookUrl: e.target.value }));
                  setError("");
                  setSuccess(false);
                }}
                placeholder="https://hooks.zapier.com/..."
                className="dash-input"
              />
              <p className="text-[11px] text-muted-foreground">
                Envoyé en JSON sur chaque clic CTA (événement <code className="text-primary">cta_click</code>), en-tête{" "}
                <code className="text-primary">X-Faymoos-Signature</code> si un secret est défini.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Secret webhook (HMAC-SHA256, optionnel)</label>
              <input
                type="password"
                autoComplete="off"
                value={form.ctaWebhookSecret}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, ctaWebhookSecret: e.target.value }));
                  setCtaSecretDirty(true);
                  setError("");
                  setSuccess(false);
                }}
                placeholder={
                  profile.hasCtaWebhookSecret && !ctaSecretDirty
                    ? "Secret enregistré — saisir pour remplacer"
                    : "Optionnel"
                }
                className="dash-input"
              />
              <p className="text-[11px] text-muted-foreground">
                Laissez vide et enregistrez sans modifier ce champ pour conserver le secret actuel. Saisissez vide après l’avoir touché pour le supprimer.
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Liens sociaux</label>
            <div className="space-y-2">
              {socialPlatforms.map((p) => (
                <div key={p.key} className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {p.icon}
                  </span>
                  <input
                    type="url"
                    value={socialLinks[p.key] || ""}
                    onChange={(e) => setSocialLinks((prev) => ({ ...prev, [p.key]: e.target.value }))}
                    placeholder={p.placeholder}
                    className="dash-input flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="dash-btn-secondary px-5 py-2.5"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="dash-btn-primary px-6 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
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
