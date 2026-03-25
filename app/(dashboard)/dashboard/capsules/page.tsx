"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────
type Branch = {
  id: string;
  headline: string;
  description: string;
  cta: string;
  proof: string | null;
};

type Option = {
  id: string;
  label: string;
  branch: Branch | null;
};

type Capsule = {
  id: string;
  title: string;
  objective: string;
  identityId: string;
  options: Option[];
};

type Identity = {
  id: string;
  name: string;
  slug: string;
  type: string;
  avatar: string | null;
};

// ─── Branch Modal ────────────────────────────────────────
function BranchModal({
  optionId,
  optionLabel,
  branch,
  onClose,
  onSaved,
}: {
  optionId: string;
  optionLabel: string;
  branch: Branch | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [headline, setHeadline] = useState(branch?.headline || "");
  const [description, setDescription] = useState(branch?.description || "");
  const [cta, setCta] = useState(branch?.cta || "");
  const [proof, setProof] = useState(branch?.proof || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!headline.trim() || !description.trim() || !cta.trim()) {
      setError("Headline, description et CTA sont requis");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        headline: headline.trim(),
        description: description.trim(),
        cta: cta.trim(),
        proof: proof.trim() || null,
      };
      const res = await fetch("/api/branches", {
        method: branch ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          branch ? { id: branch.id, ...payload } : { optionId, ...payload }
        ),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erreur");
        return;
      }
      onSaved();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-violet-500/10 animate-in">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {branch ? "Modifier la branche" : "Configurer la branche"}
              </h3>
              <p className="text-xs text-slate-400">
                Option : &quot;{optionLabel}&quot;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-slate-800 transition-all"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">
              Headline *
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => {
                setHeadline(e.target.value);
                setError("");
              }}
              placeholder="Ex: Projet Maison — On construit votre rêve"
              className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Détaillez ce que le visiteur verra quand il clique cette option..."
              className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">
              Call-to-Action (CTA) *
            </label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Ex: https://calendly.com/monrdv ou Contactez-moi"
              className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">
              Preuve / Proof
            </label>
            <textarea
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              rows={2}
              placeholder="Ex: +50 projets livrés, 98% satisfaction client..."
              className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-violet-50 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            {saving
              ? "Enregistrement..."
              : branch
              ? "Modifier"
              : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Capsule Builder Card ────────────────────────────────
function CapsuleCard({
  capsule,
  identity,
  onDeleted,
  onUpdated,
}: {
  capsule: Capsule;
  identity: Identity;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(capsule.title);
  const [objective, setObjective] = useState(capsule.objective);
  const [savingTitle, setSavingTitle] = useState(false);

  // Options
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [addingOption, setAddingOption] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editOptionLabel, setEditOptionLabel] = useState("");

  // Branch modal
  const [branchModal, setBranchModal] = useState<{
    optionId: string;
    optionLabel: string;
    branch: Branch | null;
  } | null>(null);

  // Delete
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    const url = `${window.location.origin}/capsule/${identity.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSaveTitle() {
    if (!title.trim() || !objective.trim()) return;
    setSavingTitle(true);
    try {
      const res = await fetch("/api/capsules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: capsule.id,
          title: title.trim(),
          objective: objective.trim(),
        }),
      });
      if (res.ok) {
        setEditingTitle(false);
        onUpdated();
      }
    } catch {
      // ignore
    } finally {
      setSavingTitle(false);
    }
  }

  async function handleAddOption() {
    if (!newOptionLabel.trim()) return;
    setAddingOption(true);
    try {
      const res = await fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capsuleId: capsule.id,
          label: newOptionLabel.trim(),
        }),
      });
      if (res.ok) {
        setNewOptionLabel("");
        onUpdated();
      }
    } catch {
      // ignore
    } finally {
      setAddingOption(false);
    }
  }

  async function handleUpdateOption(optionId: string) {
    if (!editOptionLabel.trim()) return;
    try {
      const res = await fetch("/api/options", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: optionId, label: editOptionLabel.trim() }),
      });
      if (res.ok) {
        setEditingOptionId(null);
        onUpdated();
      }
    } catch {
      // ignore
    }
  }

  async function handleDeleteOption(optionId: string) {
    try {
      const res = await fetch(`/api/options?id=${optionId}`, {
        method: "DELETE",
      });
      if (res.ok) onUpdated();
    } catch {
      // ignore
    }
  }

  async function handleDeleteBranch(branchId: string) {
    try {
      const res = await fetch(`/api/branches?id=${branchId}`, {
        method: "DELETE",
      });
      if (res.ok) onUpdated();
    } catch {
      // ignore
    }
  }

  async function handleDeleteCapsule() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/capsules?id=${capsule.id}`, {
        method: "DELETE",
      });
      if (res.ok) onDeleted();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }

  const optionsWithBranch = capsule.options.filter((o) => o.branch);
  const isComplete = capsule.options.length >= 2 && optionsWithBranch.length === capsule.options.length;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-200 hover:border-violet-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
                    placeholder="Titre de la capsule"
                  />
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    rows={2}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
                    placeholder="Question / Objectif"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTitle}
                      disabled={savingTitle}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition-all disabled:opacity-60"
                    >
                      {savingTitle ? "..." : "Sauvegarder"}
                    </button>
                    <button
                      onClick={() => {
                        setTitle(capsule.title);
                        setObjective(capsule.objective);
                        setEditingTitle(false);
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-800 truncate">
                      {capsule.title}
                    </h3>
                    {isComplete && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 ring-1 ring-emerald-200">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                        Prête
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {capsule.objective}
                  </p>
                </div>
              )}
            </div>

            {!editingTitle && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleCopyLink}
                  className={`rounded-lg p-2 transition-all ${
                    copied
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                  }`}
                  title={copied ? "Lien copié !" : "Copier le lien"}
                >
                  {copied ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  )}
                </button>
                <Link
                  href={`/capsule/${identity.slug}`}
                  target="_blank"
                  className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all"
                  title="Prévisualiser"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </Link>
                <button
                  onClick={() => setEditingTitle(true)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-slate-800 transition-all"
                  title="Modifier"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                  title="Supprimer"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
              {capsule.options.length} option
              {capsule.options.length !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              {optionsWithBranch.length}/{capsule.options.length} branche
              {optionsWithBranch.length !== 1 ? "s" : ""}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-violet-600 transition-colors"
            >
              {isExpanded ? "Réduire" : "Configurer"}
              <svg
                className={`h-3.5 w-3.5 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          </div>

          {/* Capsule URL */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <code className="text-xs text-slate-500 font-mono truncate flex-1">
              faymoos.com/capsule/{identity.slug}
            </code>
            <button
              onClick={handleCopyLink}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                copied
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-white text-slate-500 hover:text-violet-600 border border-slate-200"
              }`}
            >
              {copied ? "Copié ✓" : "Copier"}
            </button>
          </div>
        </div>

        {/* Expanded: Options & Branches */}
        {isExpanded && (
          <div className="px-6 py-5 space-y-5 bg-slate-50/50 animate-in">
            {/* Options list */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Options de la capsule
              </h4>

              {capsule.options.length === 0 ? (
                <p className="text-sm text-slate-400 italic mb-3">
                  Aucune option — ajoutez au moins 2 options pour que la capsule
                  fonctionne.
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {capsule.options.map((option, idx) => (
                    <div
                      key={option.id}
                      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                    >
                      {/* Option header */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600 shrink-0">
                          {idx + 1}
                        </span>

                        {editingOptionId === option.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <input
                              type="text"
                              value={editOptionLabel}
                              onChange={(e) =>
                                setEditOptionLabel(e.target.value)
                              }
                              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleUpdateOption(option.id);
                                if (e.key === "Escape")
                                  setEditingOptionId(null);
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateOption(option.id)}
                              className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs text-white hover:bg-violet-500"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingOptionId(null)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                              {option.label}
                            </span>
                            <div className="flex items-center gap-1">
                              {option.branch ? (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-200">
                                  <svg
                                    className="h-2.5 w-2.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M4.5 12.75l6 6 9-13.5"
                                    />
                                  </svg>
                                  Branche
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-200">
                                  Sans branche
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setEditingOptionId(option.id);
                                  setEditOptionLabel(option.label);
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                                title="Renommer"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteOption(option.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="Supprimer l'option"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Branch details or create */}
                      {option.branch ? (
                        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                          <div className="flex items-start gap-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {option.branch.headline}
                              </p>
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                {option.branch.description}
                              </p>
                              <p className="text-[11px] text-violet-500 mt-1 truncate">
                                CTA: {option.branch.cta}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() =>
                                  setBranchModal({
                                    optionId: option.id,
                                    optionLabel: option.label,
                                    branch: option.branch,
                                  })
                                }
                                className="rounded-lg p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                                title="Modifier la branche"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteBranch(option.branch!.id)
                                }
                                className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="Supprimer la branche"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-slate-100 px-4 py-2.5">
                          <button
                            onClick={() =>
                              setBranchModal({
                                optionId: option.id,
                                optionLabel: option.label,
                                branch: null,
                              })
                            }
                            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-all w-full justify-center"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                              />
                            </svg>
                            Configurer la branche
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add option */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddOption();
                  }}
                  placeholder="Nouvelle option (ex: Maison, Bureau...)"
                  className="flex-1 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
                />
                <button
                  onClick={handleAddOption}
                  disabled={addingOption || !newOptionLabel.trim()}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-all disabled:opacity-40 shrink-0"
                >
                  {addingOption ? "..." : "+ Ajouter"}
                </button>
              </div>
            </div>

            {/* Quick tip */}
            {capsule.options.length > 0 &&
              capsule.options.length < 2 && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <svg
                    className="h-4 w-4 text-amber-500 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  <p className="text-xs text-amber-700">
                    Ajoutez au moins <strong>2 options</strong> pour que votre
                    capsule soit interactive. Chaque option doit avoir une{" "}
                    <strong>branche</strong> configurée.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Branch Modal */}
      {branchModal && (
        <BranchModal
          optionId={branchModal.optionId}
          optionLabel={branchModal.optionLabel}
          branch={branchModal.branch}
          onClose={() => setBranchModal(null)}
          onSaved={() => {
            setBranchModal(null);
            onUpdated();
          }}
        />
      )}

      {/* Delete capsule confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-200">
                <svg
                  className="h-7 w-7 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Supprimer cette capsule ?
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  La capsule{" "}
                  <span className="font-semibold text-slate-800">
                    {capsule.title}
                  </span>{" "}
                  et toutes ses options/branches seront supprimées.
                </p>
              </div>
              <div className="flex w-full gap-3 mt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-violet-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteCapsule}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {deleting ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Create Capsule Modal ────────────────────────────────
function CreateCapsuleModal({
  identities,
  onClose,
  onCreated,
}: {
  identities: Identity[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const [identityId, setIdentityId] = useState(
    identities.length === 1 ? identities[0].id : ""
  );
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!identityId) {
      setError("Choisissez une identité");
      return;
    }
    if (!title.trim() || !objective.trim()) {
      setError("Titre et objectif requis");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/capsules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityId,
          title: title.trim(),
          objective: objective.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erreur");
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
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-violet-500/10 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Nouvelle capsule
              </h3>
              <p className="text-xs text-slate-400">
                Étape {step} sur {identities.length > 1 ? "2" : "1"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-violet-50 hover:text-slate-800 transition-all"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="h-0.5 bg-violet-50/50">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-300"
            style={{
              width:
                identities.length > 1
                  ? step === 1
                    ? "50%"
                    : "100%"
                  : "100%",
            }}
          />
        </div>

        <div className="px-6 py-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600">
              <svg
                className="h-4 w-4 shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Step 1: choose identity (only if multiple) */}
          {step === 1 && identities.length > 1 && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-500">
                Pour quelle identité ? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {identities.map((id) => (
                  <button
                    key={id.id}
                    type="button"
                    onClick={() => {
                      setIdentityId(id.id);
                      setError("");
                    }}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.97] ${
                      identityId === id.id
                        ? "border-violet-400 bg-violet-50 ring-2 ring-violet-300 shadow-lg shadow-violet-200"
                        : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white overflow-hidden">
                      {id.avatar ? (
                        <img
                          src={id.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        id.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          identityId === id.id
                            ? "text-violet-700"
                            : "text-slate-600"
                        }`}
                      >
                        {id.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{id.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 (or step 1 if single identity): capsule details */}
          {(step === 2 || identities.length <= 1) && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">
                  Titre de la capsule *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError("");
                  }}
                  placeholder='Ex: "Demande de projet", "Besoin d&#39;accompagnement"'
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">
                  Question / Objectif *
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={3}
                  placeholder='Ex: "Quel type de projet avez-vous en tête ?", "Que recherchez-vous ?"'
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all"
                />
              </div>

              <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                <p className="text-xs text-violet-600 leading-relaxed">
                  <strong>Conseil :</strong> Une bonne capsule pose une question
                  claire. Le visiteur choisira parmi les options que vous
                  ajouterez ensuite. Chaque option mène vers une branche
                  personnalisée avec un CTA.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            onClick={() => {
              if (step === 1 || identities.length <= 1) {
                onClose();
              } else {
                setStep(1);
              }
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-violet-50"
          >
            {step === 1 || identities.length <= 1 ? "Annuler" : "Retour"}
          </button>
          <button
            onClick={() => {
              if (step === 1 && identities.length > 1) {
                if (!identityId) {
                  setError("Choisissez une identité");
                  return;
                }
                setError("");
                setStep(2);
              } else {
                handleCreate();
              }
            }}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Création...
              </span>
            ) : step === 1 && identities.length > 1 ? (
              "Suivant"
            ) : (
              "Créer la capsule"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function CapsulesPage() {
  const router = useRouter();
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [capsules, setCapsules] = useState<
    (Capsule & { identityName: string; identitySlug: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterIdentity, setFilterIdentity] = useState<string>("ALL");

  async function fetchData() {
    try {
      // Fetch identities
      const identRes = await fetch("/api/identity");
      if (identRes.status === 401) {
        router.push("/login");
        return;
      }
      const identData: Identity[] = await identRes.json();
      setIdentities(identData);

      // Fetch capsules for each identity
      const allCapsules: (Capsule & {
        identityName: string;
        identitySlug: string;
      })[] = [];
      for (const ident of identData) {
        const capRes = await fetch(`/api/capsules?identityId=${ident.id}`);
        if (capRes.ok) {
          const caps: Capsule[] = await capRes.json();
          for (const c of caps) {
            allCapsules.push({
              ...c,
              identityName: ident.name,
              identitySlug: ident.slug,
            });
          }
        }
      }
      setCapsules(allCapsules);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered =
    filterIdentity === "ALL"
      ? capsules
      : capsules.filter((c) => c.identityId === filterIdentity);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-8 w-8 animate-spin text-violet-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-slate-400">Chargement des capsules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Mes Capsules
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {capsules.length} capsule{capsules.length !== 1 ? "s" : ""} —
            Créez des interactions intelligentes avec vos visiteurs
          </p>
        </div>
        <button
          onClick={() => {
            if (identities.length === 0) return;
            setShowCreate(true);
          }}
          disabled={identities.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nouvelle capsule
        </button>
      </div>

      {/* Identity filter */}
      {identities.length > 1 && (
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 w-fit">
          <button
            onClick={() => setFilterIdentity("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filterIdentity === "ALL"
                ? "bg-violet-100 text-slate-800"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Toutes
          </button>
          {identities.map((id) => (
            <button
              key={id.id}
              onClick={() => setFilterIdentity(id.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filterIdentity === id.id
                  ? "bg-violet-100 text-slate-800"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {id.name}
            </button>
          ))}
        </div>
      )}

      {/* No identities warning */}
      {identities.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50 py-16 px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 ring-1 ring-amber-200 mb-4">
            <svg
              className="h-7 w-7 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Créez d&apos;abord une identité
          </h3>
          <p className="mt-1 text-sm text-slate-500 text-center max-w-sm">
            Vous devez avoir au moins une identité pour créer des capsules.
          </p>
          <Link
            href="/dashboard/identities"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-all"
          >
            Créer une identité
          </Link>
        </div>
      )}

      {/* Empty state */}
      {identities.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 ring-1 ring-violet-200 mb-5">
            <svg
              className="h-8 w-8 text-violet-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            {filterIdentity === "ALL"
              ? "Aucune capsule"
              : "Aucune capsule pour cette identité"}
          </h3>
          <p className="mt-1 text-sm text-slate-400 max-w-xs text-center">
            Créez votre première capsule interactive pour engager vos visiteurs.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600/15 px-5 py-2.5 text-sm font-medium text-violet-600 ring-1 ring-violet-200 transition-all hover:bg-indigo-600/25"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Créer ma première capsule
          </button>
        </div>
      )}

      {/* Capsule cards */}
      {filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((capsule) => {
            const identity = identities.find(
              (i) => i.id === capsule.identityId
            );
            if (!identity) return null;
            return (
              <div key={capsule.id}>
                {/* Identity badge */}
                {identities.length > 1 && (
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-[10px] font-bold text-white overflow-hidden">
                      {identity.avatar ? (
                        <img
                          src={identity.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        identity.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {identity.name}
                    </span>
                  </div>
                )}
                <CapsuleCard
                  capsule={capsule}
                  identity={identity}
                  onDeleted={fetchData}
                  onUpdated={fetchData}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateCapsuleModal
          identities={identities}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
