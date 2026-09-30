"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AssetThumb } from "./AssetThumb";
import { UploadDropzone } from "./UploadDropzone";
import {
  ACCEPT_BY_KIND,
  assetName,
  formatBytes,
  KIND_TABS,
  type KindFilter,
  type MediaAsset,
  type UploadType,
} from "./media-types";
import { useAssetList } from "./useAssetList";
import { useUploads } from "./useUploads";

export type PickerAccept = "image" | "video" | "any";

type PickerProps = {
  open: boolean;
  onClose: () => void;
  /** Toujours une liste (un seul élément si `multiple` est faux). */
  onSelect: (assets: MediaAsset[]) => void;
  accept?: PickerAccept;
  multiple?: boolean;
  /** Dossier / origine des fichiers envoyés depuis le sélecteur. */
  uploadType?: UploadType;
  title?: string;
};

const INPUT =
  "rounded-xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-sm text-[#F7F4EE] placeholder:text-white/30 outline-none focus:border-[#C6A15B]/60";

/**
 * Sélecteur « Choisir dans la bibliothèque », réutilisable partout (profil, portfolio,
 * capsules, logo QR…). Ne charge rien tant qu’il est fermé.
 */
export function MediaPickerDialog(props: PickerProps) {
  // Portail : un parent animé (transform) ne doit pas enfermer la fenêtre « fixed ».
  if (!props.open || typeof document === "undefined") return null;
  return createPortal(<PickerContent {...props} />, document.body);
}

function PickerContent({
  onClose,
  onSelect,
  accept = "image",
  multiple = false,
  uploadType = "library",
  title = "Choisir dans la bibliothèque",
}: PickerProps) {
  const fixedKind: KindFilter | null = accept === "image" ? "image" : accept === "video" ? "video" : null;
  const [tab, setTab] = useState<KindFilter>(fixedKind ?? "all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [picked, setPicked] = useState<MediaAsset[]>([]);

  const list = useAssetList(fixedKind ?? tab, q, "recent", reloadToken);
  const uploads = useUploads(uploadType);

  useEffect(() => {
    const t = window.setTimeout(() => setQ(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(asset: MediaAsset) {
    if (!multiple) {
      setPicked([asset]);
      return;
    }
    setPicked((p) => (p.some((x) => x.id === asset.id) ? p.filter((x) => x.id !== asset.id) : [...p, asset]));
  }

  async function onFiles(files: File[]) {
    const added = await uploads.upload(multiple ? files : files.slice(0, 1));
    const usable = added.filter((a) => !fixedKind || (fixedKind === "image" ? a.kind === "IMAGE" : a.kind === "VIDEO"));
    if (usable.length) {
      // Un média tout juste envoyé est présélectionné.
      setPicked((p) => (multiple ? [...p, ...usable.filter((u) => !p.some((x) => x.id === u.id))] : [usable[0]!]));
      setReloadToken((n) => n + 1);
    }
  }

  const acceptAttr = ACCEPT_BY_KIND[fixedKind ?? "all"];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0B0D10] text-[#F7F4EE] shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg px-2 text-xl text-white/45 hover:text-white">
            ×
          </button>
        </div>

        <div className="space-y-3 border-b border-white/10 px-5 py-4">
          <UploadDropzone
            compact
            accept={acceptAttr}
            multiple={multiple}
            hint={accept === "image" ? "Images JPG, PNG, WebP, GIF — 5 Mo max" : "Images, vidéos ou modèles 3D"}
            items={uploads.items}
            busy={uploads.busy}
            onFiles={onFiles}
            onDismiss={uploads.dismiss}
          />
          <div className="flex flex-wrap items-center gap-2">
            {!fixedKind && (
              <div role="tablist" aria-label="Type de média" className="flex gap-1 rounded-xl border border-white/10 p-1">
                {KIND_TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium ${tab === t.key ? "bg-[#C6A15B] text-[#0B0D10]" : "text-white/55"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              aria-label="Rechercher un média"
              className={`${INPUT} flex-1`}
            />
          </div>
        </div>

        <div className="min-h-[240px] flex-1 overflow-y-auto px-5 py-4">
          {list.error ? (
            <p className="text-sm text-red-300">{list.error}</p>
          ) : list.loading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/[.04]" />
              ))}
            </div>
          ) : list.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/45">
              {q ? `Aucun résultat pour « ${q} ».` : "Votre bibliothèque est vide : envoyez un fichier ci-dessus."}
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {list.items.map((a) => {
                const isPicked = picked.some((p) => p.id === a.id);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => toggle(a)}
                      onDoubleClick={() => !multiple && onSelect([a])}
                      aria-pressed={isPicked}
                      title={assetName(a)}
                      className={`relative block aspect-square w-full overflow-hidden rounded-xl border transition ${
                        isPicked ? "border-[#C6A15B] ring-2 ring-[#C6A15B]/50" : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <AssetThumb asset={a} />
                      {isPicked && (
                        <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#C6A15B] text-xs font-bold text-[#0B0D10]" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {list.hasMore && (
            <div className="mt-4 text-center">
              <button type="button" disabled={list.loadingMore} onClick={list.loadMore} className="text-sm text-[#C6A15B] disabled:opacity-50">
                {list.loadingMore ? "Chargement…" : "Afficher plus"}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
          <p className="min-w-0 truncate text-xs text-white/45">
            {picked.length === 0
              ? multiple
                ? "Sélectionnez un ou plusieurs médias"
                : "Sélectionnez un média"
              : multiple
                ? `${picked.length} sélectionné(s)`
                : `${assetName(picked[0]!)} · ${formatBytes(picked[0]!.sizeBytes)}`}
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70">
              Annuler
            </button>
            <button
              type="button"
              disabled={picked.length === 0}
              onClick={() => onSelect(picked)}
              className="rounded-xl bg-[#C6A15B] px-4 py-2 text-sm font-semibold text-[#0B0D10] transition hover:brightness-110 disabled:opacity-40"
            >
              Utiliser{multiple && picked.length > 1 ? ` (${picked.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
