"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { EditProfileModal } from "@/components/EditProfileModal";
import QRCode from "qrcode";

type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  year: number | null;
  isPublic: boolean;
};

type Testimonial = {
  id: string;
  author: string;
  content: string;
  role: string | null;
  company: string | null;
};

type IdentityProfile = {
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
  hideBranding?: boolean;
  ctaWebhookUrl?: string | null;
  ctaWebhookSecret?: string | null;
  hasCtaWebhookSecret?: boolean;
  createdAt: string;
  portfolioProjects: PortfolioProject[];
  testimonials: Testimonial[];
  capsules: { id: string; title: string }[];
};

const typeLabels: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  FREELANCER: { label: "Freelancer", icon: "💼", color: "text-blue-600", bg: "bg-blue-500/15 ring-blue-500/20" },
  AGENCY: { label: "Agence", icon: "🏢", color: "text-purple-600", bg: "bg-purple-500/15 ring-purple-500/20" },
  CREATOR: { label: "Créateur", icon: "🎨", color: "text-pink-600", bg: "bg-pink-500/15 ring-pink-500/20" },
  STARTUP: { label: "Startup", icon: "🚀", color: "text-emerald-600", bg: "bg-emerald-500/15 ring-emerald-500/20" },
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-zinc-900 shadow-2xl shadow-violet-500/10 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Nouvelle identité</h3>
              <p className="text-xs text-slate-400">Étape {step} sur 2</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-slate-800 transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-violet-50/50">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-300"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600">
              <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Nom de l&apos;identité *</label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Ex: Studio Créatif, Mon Portfolio..."
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ex: Développeur Full-Stack passionné"
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Décrivez cette identité en quelques mots..."
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-500">Type de profil *</label>
              <div className="grid grid-cols-2 gap-3">
                {profileTypeOptions.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { setType(t.value); setError(""); }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-all duration-200 active:scale-[0.97] ${
                      type === t.value
                        ? "border-violet-400 bg-violet-50 ring-2 ring-violet-300 shadow-lg shadow-violet-200"
                        : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50"
                    }`}
                  >
                    <span className="text-3xl">{t.icon}</span>
                    <span className={`text-sm font-semibold ${type === t.value ? "text-violet-700" : "text-slate-600"}`}>
                      {t.label}
                    </span>
                    <span className="text-[11px] text-slate-400">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            onClick={() => step === 1 ? onClose() : setStep(1)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-violet-50"
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
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-slate-800 shadow-lg shadow-violet-500/20 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-zinc-900 p-6 shadow-2xl shadow-violet-500/10 animate-in">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-200">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Supprimer cette identité ?</h3>
            <p className="mt-2 text-sm text-slate-500">
              L&apos;identité <span className="font-semibold text-slate-800">{profileName}</span> et toutes ses données seront supprimées définitivement.
            </p>
          </div>
          <div className="flex w-full gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-violet-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-slate-800 transition-all hover:bg-red-500 active:scale-[0.98] disabled:opacity-60"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio Project Modal ─────────────────────────────
function PortfolioModal({
  identityId,
  project,
  onClose,
  onSaved,
}: {
  identityId: string;
  project: PortfolioProject | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(project?.title || "");
  const [description, setDescription] = useState(project?.description || "");
  const [image, setImage] = useState(project?.image || "");
  const [year, setYear] = useState(project?.year?.toString() || "");
  const [isPublic, setIsPublic] = useState(project?.isPublic !== false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "portfolio");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { setError("Erreur upload image"); return; }
      const data = await res.json();
      setImage(data.url);
    } catch { setError("Erreur upload"); } finally { setUploading(false); }
  }

  async function handleSave() {
    if (!title.trim() || !description.trim()) { setError("Titre et description requis"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { identityId, title: title.trim(), description: description.trim(), image: image || null, year: year || null, isPublic };
      const res = await fetch("/api/portfolio", {
        method: project ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project ? { id: project.id, ...payload } : payload),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Erreur"); return; }
      onSaved();
    } catch { setError("Erreur de connexion"); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-violet-500/10 animate-in">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">📁</div>
            <h3 className="text-lg font-semibold text-slate-800">{project ? "Modifier le projet" : "Nouveau projet"}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-slate-800 transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          {/* Image upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Image du projet</label>
            <div className="flex items-center gap-4">
              {image ? (
                <div className="relative h-20 w-28 rounded-xl overflow-hidden border border-slate-200">
                  <img src={image} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setImage("")} className="absolute top-1 right-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-violet-400 hover:bg-violet-50/50 transition-all">
                  {uploading ? (
                    <svg className="h-5 w-5 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <>
                      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5h.008v.008H6.75V7.5z" /></svg>
                      <span className="mt-1 text-[10px] text-slate-400">Ajouter</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Titre *</label>
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setError(""); }}
              placeholder="Nom du projet" className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Décrivez ce projet..." className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Année</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)}
                placeholder="2024" className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm text-slate-600">Public</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-violet-50 transition-all">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 transition-all">
            {saving ? "Enregistrement..." : project ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Testimonial Modal ───────────────────────────────────
function TestimonialModal({
  identityId,
  testimonial,
  onClose,
  onSaved,
}: {
  identityId: string;
  testimonial: Testimonial | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [author, setAuthor] = useState(testimonial?.author || "");
  const [content, setContent] = useState(testimonial?.content || "");
  const [role, setRole] = useState(testimonial?.role || "");
  const [company, setCompany] = useState(testimonial?.company || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!author.trim() || !content.trim()) { setError("Auteur et contenu requis"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { identityId, author: author.trim(), content: content.trim(), role: role.trim() || null, company: company.trim() || null };
      const res = await fetch("/api/testimonials", {
        method: testimonial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testimonial ? { id: testimonial.id, ...payload } : payload),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Erreur"); return; }
      onSaved();
    } catch { setError("Erreur de connexion"); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-violet-500/10 animate-in">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">💬</div>
            <h3 className="text-lg font-semibold text-slate-800">{testimonial ? "Modifier le témoignage" : "Nouveau témoignage"}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-slate-800 transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Nom du client *</label>
            <input type="text" value={author} onChange={e => { setAuthor(e.target.value); setError(""); }}
              placeholder="Jean Dupont" className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Rôle / Poste</label>
              <input type="text" value={role} onChange={e => setRole(e.target.value)}
                placeholder="CEO, Manager..." className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all" />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Entreprise</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="Nom de l'entreprise" className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Témoignage *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
              placeholder="Le retour d'expérience du client..." className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-violet-50 transition-all">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 transition-all">
            {saving ? "Enregistrement..." : testimonial ? "Modifier" : "Ajouter"}
          </button>
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

  // Portfolio & Testimonial modals
  const [portfolioModal, setPortfolioModal] = useState<{ identityId: string; project: PortfolioProject | null } | null>(null);
  const [testimonialModal, setTestimonialModal] = useState<{ identityId: string; testimonial: Testimonial | null } | null>(null);
  const [deletingPortfolio, setDeletingPortfolio] = useState<{ id: string; title: string } | null>(null);
  const [deletingTestimonial, setDeletingTestimonial] = useState<{ id: string; author: string } | null>(null);

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

  async function handleDeletePortfolio() {
    if (!deletingPortfolio) return;
    try {
      const res = await fetch(`/api/portfolio?id=${deletingPortfolio.id}`, { method: "DELETE" });
      if (res.ok) { setDeletingPortfolio(null); fetchIdentities(); }
    } catch { /* ignore */ }
  }

  async function handleDeleteTestimonial() {
    if (!deletingTestimonial) return;
    try {
      const res = await fetch(`/api/testimonials?id=${deletingTestimonial.id}`, { method: "DELETE" });
      if (res.ok) { setDeletingTestimonial(null); fetchIdentities(); }
    } catch { /* ignore */ }
  }

  const filtered = filterType === "ALL"
    ? identities
    : identities.filter((p) => p.type === filterType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-400">Chargement des identités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Mes Identités</h1>
          <p className="mt-1 text-sm text-slate-400">
            {identities.length} identité{identities.length !== 1 ? "s" : ""} professionnelle{identities.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-lg shadow-violet-500/20 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl active:scale-[0.98]"
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
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setFilterType("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filterType === "ALL" ? "bg-violet-100 text-slate-800" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Tous
          </button>
          {profileTypeOptions.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filterType === t.value ? "bg-violet-100 text-slate-800" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="mr-1">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-1.5 transition-all ${viewMode === "grid" ? "bg-violet-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
            title="Grille"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-1.5 transition-all ${viewMode === "list" ? "bg-violet-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 ring-1 ring-violet-200 mb-5">
            <svg className="h-8 w-8 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            {filterType === "ALL" ? "Aucune identité" : "Aucune identité de ce type"}
          </h3>
          <p className="mt-1 text-sm text-slate-400 max-w-xs text-center">
            {filterType === "ALL"
              ? "Créez votre première identité professionnelle pour commencer."
              : "Essayez un autre filtre ou créez une nouvelle identité."}
          </p>
          {filterType === "ALL" && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600/15 px-5 py-2.5 text-sm font-medium text-violet-600 ring-1 ring-violet-200 transition-all hover:bg-indigo-600/25"
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
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-violet-200 hover:bg-violet-50/50 overflow-hidden"
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
                      className="rounded-lg bg-black/50 p-1.5 text-slate-800/70 backdrop-blur-sm hover:bg-black/20 hover:text-slate-800 transition-all"
                      title="Modifier"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingProfile(profile)}
                      className="rounded-lg bg-black/50 p-1.5 text-red-500/70 backdrop-blur-sm hover:bg-red-600/30 hover:text-red-600 transition-all"
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xl font-bold text-slate-800 shadow-lg shadow-indigo-500/20 ring-4 ring-white overflow-hidden">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                      profile.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <h3 className="mt-3 text-base font-semibold text-slate-800">{profile.name}</h3>
                  {profile.headline && (
                    <p className="mt-0.5 text-sm text-slate-400 line-clamp-1">{profile.headline}</p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${typeInfo.bg} ${typeInfo.color}`}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    <span className="text-[11px] text-slate-400">{created}</span>
                  </div>

                  {profile.bio && (
                    <p className="mt-3 text-sm text-slate-500 line-clamp-2 leading-relaxed">{profile.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">{profile.portfolioProjects.length}</p>
                      <p className="text-[11px] text-slate-400">Projets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">{profile.capsules.length}</p>
                      <p className="text-[11px] text-slate-400">Capsules</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">{profile.testimonials.length}</p>
                      <p className="text-[11px] text-slate-400">Avis</p>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                    className="mt-3 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-slate-400 hover:text-violet-600 transition-colors"
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
                    <div className="mt-3 space-y-4 border-t border-slate-100 pt-4 animate-in">
                      {/* Projects */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Projets ({profile.portfolioProjects.length})
                          </h4>
                          <button
                            onClick={() => setPortfolioModal({ identityId: profile.id, project: null })}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-all"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Ajouter
                          </button>
                        </div>
                        {profile.portfolioProjects.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Aucun projet</p>
                        ) : (
                          <div className="space-y-1.5">
                            {profile.portfolioProjects.map((p) => (
                              <div key={p.id} className="group/item flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                                {p.image ? (
                                  <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded bg-violet-50/50 text-slate-400">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-slate-600 truncate block">{p.title}</span>
                                  {p.description && <span className="text-[11px] text-slate-400 truncate block">{p.description}</span>}
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  <button onClick={() => setPortfolioModal({ identityId: profile.id, project: p })} className="rounded p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all" title="Modifier">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                  </button>
                                  <button onClick={() => setDeletingPortfolio({ id: p.id, title: p.title })} className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Supprimer">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Capsules */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Capsules ({profile.capsules.length})
                        </h4>
                        {profile.capsules.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Aucune capsule</p>
                        ) : (
                          <div className="space-y-1.5">
                            {profile.capsules.map((c) => (
                              <div key={c.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-500/10 text-violet-400">
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3" />
                                  </svg>
                                </div>
                                <span className="text-sm text-slate-600 truncate">{c.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Testimonials */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Témoignages ({profile.testimonials.length})
                          </h4>
                          <button
                            onClick={() => setTestimonialModal({ identityId: profile.id, testimonial: null })}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-all"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Ajouter
                          </button>
                        </div>
                        {profile.testimonials.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Aucun témoignage</p>
                        ) : (
                          <div className="space-y-1.5">
                            {profile.testimonials.map((t) => (
                              <div key={t.id} className="group/item flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold shrink-0">
                                  {t.author.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-slate-600 truncate block">{t.author}</span>
                                  {t.role && <span className="text-[11px] text-slate-400 truncate block">{t.role}{t.company ? ` · ${t.company}` : ""}</span>}
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  <button onClick={() => setTestimonialModal({ identityId: profile.id, testimonial: t })} className="rounded p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all" title="Modifier">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                  </button>
                                  <button onClick={() => setDeletingTestimonial({ id: t.id, author: t.author })} className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Supprimer">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Slug link */}
                      <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                        <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        <span className="text-xs text-slate-400 font-mono truncate flex-1">
                          faymoos.com/capsule/{profile.slug}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/capsule/${profile.slug}`)}
                          className="rounded p-1 text-slate-400 hover:text-violet-600 transition-colors"
                          title="Copier le lien"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            const url = `${window.location.origin}/capsule/${profile.slug}`;
                            const canvas = document.createElement("canvas");
                            await QRCode.toCanvas(canvas, url, { width: 400, margin: 2 });
                            const link = document.createElement("a");
                            link.download = `${profile.name.replace(/\s+/g, "-")}-qrcode.png`;
                            link.href = canvas.toDataURL("image/png");
                            link.click();
                          }}
                          className="rounded p-1 text-slate-400 hover:text-violet-600 transition-colors"
                          title="Télécharger QR Code"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
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
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Identité</th>
                <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="hidden md:table-cell px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Projets</th>
                <th className="hidden md:table-cell px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Capsules</th>
                <th className="hidden lg:table-cell px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Créé le</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((profile) => {
                const typeInfo = typeLabels[profile.type] || typeLabels.FREELANCER;
                const created = new Date(profile.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "short", year: "numeric",
                });
                return (
                  <tr key={profile.id} className="group hover:bg-white transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-slate-800 overflow-hidden ring-2 ring-zinc-900">
                          {profile.avatar ? (
                            <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            profile.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{profile.name}</p>
                          {profile.headline && (
                            <p className="text-xs text-slate-400 truncate">{profile.headline}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-5 py-4 text-center text-sm text-slate-500">{profile.portfolioProjects.length}</td>
                    <td className="hidden md:table-cell px-5 py-4 text-center text-sm text-slate-500">{profile.capsules.length}</td>
                    <td className="hidden lg:table-cell px-5 py-4 text-sm text-slate-400">{created}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/capsule/${profile.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all"
                          title="Voir la capsule"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                        <button
                          onClick={() => setEditingProfile(profile)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-slate-800 transition-all"
                          title="Modifier"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingProfile(profile)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
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

      {portfolioModal && (
        <PortfolioModal
          identityId={portfolioModal.identityId}
          project={portfolioModal.project}
          onClose={() => setPortfolioModal(null)}
          onSaved={() => { setPortfolioModal(null); fetchIdentities(); }}
        />
      )}

      {testimonialModal && (
        <TestimonialModal
          identityId={testimonialModal.identityId}
          testimonial={testimonialModal.testimonial}
          onClose={() => setTestimonialModal(null)}
          onSaved={() => { setTestimonialModal(null); fetchIdentities(); }}
        />
      )}

      {deletingPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeletingPortfolio(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-200">
                <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Supprimer ce projet ?</h3>
                <p className="mt-2 text-sm text-slate-500">Le projet <span className="font-semibold text-slate-800">{deletingPortfolio.title}</span> sera supprimé définitivement.</p>
              </div>
              <div className="flex w-full gap-3 mt-2">
                <button onClick={() => setDeletingPortfolio(null)} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-violet-50 transition-all">Annuler</button>
                <button onClick={handleDeletePortfolio} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 active:scale-[0.98] transition-all">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeletingTestimonial(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-200">
                <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Supprimer ce témoignage ?</h3>
                <p className="mt-2 text-sm text-slate-500">Le témoignage de <span className="font-semibold text-slate-800">{deletingTestimonial.author}</span> sera supprimé définitivement.</p>
              </div>
              <div className="flex w-full gap-3 mt-2">
                <button onClick={() => setDeletingTestimonial(null)} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-violet-50 transition-all">Annuler</button>
                <button onClick={handleDeleteTestimonial} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 active:scale-[0.98] transition-all">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
