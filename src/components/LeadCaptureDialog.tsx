"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  identityId: string;
  identityName: string;
  capsuleId: string;
  optionId: string | null;
  /** Texte du bouton CTA (« Demander un devis »…) repris comme titre */
  ctaLabel: string;
  /** Classes de dégradé du thème de la capsule */
  accentClass: string;
  onClose: () => void;
};

const INPUT =
  "block w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10";

/**
 * Formulaire affiché quand un visiteur clique sur un CTA sans lien : sa demande devient un lead
 * rattaché à la capsule et à la branche choisies.
 */
export function LeadCaptureDialog(props: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(<LeadCaptureContent {...props} />, document.body);
}

function LeadCaptureContent({ identityId, identityName, capsuleId, optionId, ctaLabel, accentClass, onClose }: Props) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() && !form.phone.trim()) {
      setError("Indiquez un e-mail ou un téléphone pour être recontacté.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, identityId, capsuleId, optionId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Envoi impossible, réessayez.");
        return;
      }
      setDone(true);
    } catch {
      setError("Connexion impossible, réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-capture-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl sm:rounded-3xl"
      >
        {done ? (
          <div className="py-6 text-center">
            <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r ${accentClass} text-2xl`} aria-hidden>
              ✓
            </div>
            <h2 id="lead-capture-title" className="mt-4 text-lg font-semibold">
              Demande envoyée !
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{identityName} vous recontacte rapidement.</p>
            <button type="button" onClick={onClose} className="mt-6 text-sm text-zinc-400 hover:text-white">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="lead-capture-title" className="text-lg font-semibold">
                  {ctaLabel}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">Laissez vos coordonnées : {identityName} vous répond directement.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Fermer" className="text-xl text-zinc-500 hover:text-white">
                ×
              </button>
            </div>

            <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
              Nom *
              <input required autoComplete="name" value={form.name} onChange={set("name")} maxLength={120} className={INPUT} placeholder="Votre nom" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
                E-mail
                <input type="email" autoComplete="email" value={form.email} onChange={set("email")} maxLength={180} className={INPUT} placeholder="vous@exemple.com" />
              </label>
              <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
                Téléphone
                <input type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} maxLength={24} className={INPUT} placeholder="+33 6 12 34 56 78" />
              </label>
            </div>
            <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
              Message <span className="text-zinc-600">(optionnel)</span>
              <textarea value={form.message} onChange={set("message")} maxLength={2000} rows={3} className={INPUT} placeholder="Votre besoin en quelques mots" />
            </label>

            {/* Piège anti-robot : invisible et ignoré par les humains. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Site web
                <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
              </label>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending || form.name.trim().length < 2}
              className={`w-full rounded-2xl bg-gradient-to-r ${accentClass} px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-45`}
            >
              {sending ? "Envoi…" : "Envoyer ma demande"}
            </button>
            <p className="text-center text-[11px] text-zinc-600">
              Vos coordonnées sont transmises uniquement à {identityName}.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
