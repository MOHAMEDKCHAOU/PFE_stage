"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { assetName, formatBytes, formatDate, KIND_LABEL, SOURCE_LABEL, type MediaAsset, type MediaUsage } from "./media-types";

const INPUT =
  "block w-full rounded-xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-sm text-[#F7F4EE] placeholder:text-white/30 outline-none focus:border-[#C6A15B]/60 focus:ring-2 focus:ring-[#C6A15B]/20";

type Notice = { kind: "success" | "error"; text: string } | null;

type DialogProps = {
  asset: MediaAsset;
  onClose: () => void;
  onChanged: (asset: MediaAsset) => void;
  onDeleted: (id: string) => void;
};

/** Aperçu plein écran + fiche du média : titre, texte alternatif, tags, usages, lien, suppression. */
export function AssetDetailsDialog(props: DialogProps) {
  if (typeof document === "undefined") return null;
  return createPortal(<DetailsContent key={props.asset.id} {...props} />, document.body);
}

function DetailsContent({
  asset,
  onClose,
  onChanged,
  onDeleted,
}: DialogProps) {
  const [title, setTitle] = useState(asset.title ?? "");
  const [altText, setAltText] = useState(asset.altText ?? "");
  const [tags, setTags] = useState(asset.tags.join(", "));
  const [usages, setUsages] = useState<MediaUsage[] | null>(null);
  const [busy, setBusy] = useState<null | "save" | "delete">(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmForce, setConfirmForce] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assets/${asset.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setUsages(Array.isArray(json?.usages) ? json.usages : []);
      })
      .catch(() => {
        if (!cancelled) setUsages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [asset.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dirty =
    title.trim() !== (asset.title ?? "") ||
    altText.trim() !== (asset.altText ?? "") ||
    tags.split(",").map((t) => t.trim()).filter(Boolean).join(",") !== asset.tags.join(",");

  async function save() {
    setBusy("save");
    setNotice(null);
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, altText, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Enregistrement impossible." });
      return;
    }
    onChanged(json.asset as MediaAsset);
    setTags((json.asset as MediaAsset).tags.join(", "));
    setNotice({ kind: "success", text: "Modifications enregistrées." });
  }

  async function remove(force: boolean) {
    setBusy("delete");
    setNotice(null);
    const res = await fetch(`/api/assets/${asset.id}${force ? "?force=1" : ""}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) {
      onDeleted(asset.id);
      return;
    }
    if (Array.isArray(json.usages)) setUsages(json.usages);
    const elsewhere = Array.isArray(json.usages) && json.usages.some((u: MediaUsage) => u.external);
    setConfirmForce(res.status === 409 && !elsewhere);
    setNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Suppression impossible." });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(asset.url, window.location.origin).toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice({ kind: "error", text: "Copie impossible." });
    }
  }

  const inUse = (usages?.length ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Média : ${assetName(asset)}`}
        onClick={(e) => e.stopPropagation()}
        className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0B0D10] shadow-2xl md:grid-cols-[1fr_360px]"
      >
        <div className="grid min-h-[260px] place-items-center bg-black">
          {asset.kind === "IMAGE" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.url} alt={asset.altText ?? ""} className="max-h-[92vh] w-full object-contain" />
          )}
          {asset.kind === "VIDEO" && <video src={asset.url} controls playsInline className="max-h-[92vh] w-full" />}
          {asset.kind === "MODEL_3D" && (
            <div className="p-10 text-center">
              <span className="text-5xl text-[#C6A15B]" aria-hidden>
                ◈
              </span>
              <p className="mt-3 text-sm text-white/60">Modèle 3D — aperçu interactif bientôt disponible.</p>
              <a href={asset.url} download className="mt-4 inline-block text-sm text-[#C6A15B]">
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>

        <div className="flex max-h-[92vh] flex-col overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[.16em] text-[#C6A15B]">{KIND_LABEL[asset.kind]}</p>
              <h2 className="mt-1 break-words font-semibold">{assetName(asset)}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg px-2 text-xl text-white/45 hover:text-white">
              ×
            </button>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 rounded-2xl border border-white/10 bg-white/[.03] p-3 text-xs">
            <dt className="text-white/40">Taille</dt>
            <dd className="text-right">{formatBytes(asset.sizeBytes)}</dd>
            {asset.width && asset.height ? (
              <>
                <dt className="text-white/40">Dimensions</dt>
                <dd className="text-right">
                  {asset.width} × {asset.height}px
                </dd>
              </>
            ) : null}
            <dt className="text-white/40">Origine</dt>
            <dd className="text-right">{SOURCE_LABEL[asset.source] ?? asset.source}</dd>
            <dt className="text-white/40">Ajouté le</dt>
            <dd className="text-right">{formatDate(asset.createdAt)}</dd>
          </dl>

          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="block space-y-1 text-xs text-white/60">
              Titre
              <input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder={asset.originalName ?? "Titre"} className={INPUT} />
            </label>
            {asset.kind === "IMAGE" && (
              <label className="block space-y-1 text-xs text-white/60">
                Texte alternatif <span className="text-white/35">(accessibilité, SEO)</span>
                <textarea
                  value={altText}
                  maxLength={300}
                  rows={2}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Décrivez l’image en une phrase"
                  className={INPUT}
                />
              </label>
            )}
            <label className="block space-y-1 text-xs text-white/60">
              Tags <span className="text-white/35">(séparés par des virgules)</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="portfolio, client-x, 2026" className={INPUT} />
            </label>
            <button
              type="submit"
              disabled={!dirty || busy !== null}
              className="w-full rounded-xl bg-[#C6A15B] px-4 py-2.5 text-sm font-semibold text-[#0B0D10] transition hover:brightness-110 disabled:opacity-40"
            >
              {busy === "save" ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/40">Utilisé dans</p>
            {usages === null ? (
              <p className="mt-2 text-xs text-white/35">Recherche…</p>
            ) : usages.length === 0 ? (
              <p className="mt-2 text-xs text-white/45">Nulle part pour l’instant.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {usages.map((u, i) => (
                  <li key={`${u.type}-${i}`} className="text-xs">
                    {u.href ? (
                      <Link href={u.href} className="text-[#E2C68E] hover:underline">
                        {u.label}
                      </Link>
                    ) : (
                      <span className="text-white/50">{u.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={copyLink} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/75 hover:border-[#C6A15B]/40">
              {copied ? "Lien copié ✓" : "Copier le lien"}
            </button>
            <a href={asset.url} download={asset.originalName ?? true} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/75 hover:border-[#C6A15B]/40">
              Télécharger
            </a>
          </div>

          {notice && (
            <p
              role={notice.kind === "error" ? "alert" : "status"}
              className={`mt-4 rounded-xl border p-3 text-xs ${
                notice.kind === "error" ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
              }`}
            >
              {notice.text}
            </p>
          )}

          <div className="mt-auto pt-5">
            {confirmForce ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmForce(false)} className="flex-1 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/70">
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => remove(true)}
                  className="flex-1 rounded-xl bg-red-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-45"
                >
                  {busy === "delete" ? "Suppression…" : "Retirer et supprimer"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => remove(false)}
                className="w-full rounded-xl border border-red-400/30 px-3 py-2.5 text-xs font-medium text-red-300 transition hover:bg-red-400/10 disabled:opacity-45"
              >
                {busy === "delete" ? "Suppression…" : inUse ? "Supprimer (utilisé)" : "Supprimer"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
