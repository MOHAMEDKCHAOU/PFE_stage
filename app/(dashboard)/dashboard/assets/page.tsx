"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AssetDetailsDialog } from "@/components/media/AssetDetailsDialog";
import { AssetThumb } from "@/components/media/AssetThumb";
import { UploadDropzone } from "@/components/media/UploadDropzone";
import {
  ACCEPT_BY_KIND,
  assetName,
  formatBytes,
  formatDate,
  KIND_LABEL,
  KIND_TABS,
  SORT_OPTIONS,
  SOURCE_LABEL,
  type KindFilter,
  type MediaAsset,
  type SortKey,
} from "@/components/media/media-types";
import { useAssetList } from "@/components/media/useAssetList";
import { useUploads } from "@/components/media/useUploads";

const CARD = "rounded-3xl border border-white/10 bg-white/[.035]";
const INPUT =
  "rounded-xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-sm text-[#F7F4EE] placeholder:text-white/30 outline-none focus:border-[#C6A15B]/60 focus:ring-2 focus:ring-[#C6A15B]/20";

type Notice = { kind: "success" | "error"; text: string } | null;

export default function AssetLibraryPage() {
  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [reloadToken, setReloadToken] = useState(0);
  const [openAsset, setOpenAsset] = useState<MediaAsset | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [forceIds, setForceIds] = useState<string[] | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const list = useAssetList(kind, q, sort, reloadToken);
  const uploads = useUploads("library");
  const { hasMore, loadingMore, loadMore } = list;

  // Recherche : attend une courte pause dans la saisie avant d’interroger le serveur.
  useEffect(() => {
    const t = window.setTimeout(() => setQ(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !loadingMore) loadMore();
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  async function onFiles(files: File[]) {
    const added = await uploads.upload(files);
    if (added.length) reload();
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelection() {
    setSelecting(false);
    setSelected(new Set());
    setForceIds(null);
  }

  async function bulkDelete(ids: string[], force: boolean) {
    setBulkBusy(true);
    setNotice(null);
    const res = await fetch("/api/assets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, force }),
    });
    const json = await res.json().catch(() => ({}));
    setBulkBusy(false);
    if (!res.ok) {
      setNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Suppression impossible." });
      return;
    }
    const deleted: string[] = json.deleted ?? [];
    const blocked: Array<{ id: string; reason: string }> = json.blocked ?? [];
    list.update((items) => items.filter((i) => !deleted.includes(i.id)));
    setSelected(new Set(blocked.map((b) => b.id)));

    const inUse = blocked.filter((b) => b.reason === "IN_USE").map((b) => b.id);
    const elsewhere = blocked.filter((b) => b.reason === "USED_ELSEWHERE").length;
    setForceIds(inUse.length ? inUse : null);
    const parts = [`${deleted.length} média(s) supprimé(s).`];
    if (inUse.length) parts.push(`${inUse.length} utilisé(s) sur vos pages : confirmez pour les retirer et les supprimer.`);
    if (elsewhere) parts.push(`${elsewhere} utilisé(s) dans un autre compte : conservé(s).`);
    setNotice({ kind: blocked.length ? "error" : "success", text: parts.join(" ") });
    if (!blocked.length) exitSelection();
    reload();
  }

  const stats = list.stats;
  const allVisibleSelected = list.items.length > 0 && list.items.every((i) => selected.has(i.id));

  return (
    <div className={`space-y-6 ${selecting ? "pb-28" : "pb-6"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Bibliothèque</p>
          <h1 className="mt-2 text-3xl font-semibold">Vos médias, réutilisables partout.</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            Photos, vidéos et modèles 3D disponibles depuis votre profil, votre portfolio, vos capsules et votre QR
            partenaire.
          </p>
        </div>
        {stats && (
          <div className={`${CARD} shrink-0 px-5 py-3 text-right`}>
            <p className="text-2xl font-semibold tabular-nums">{stats.count}</p>
            <p className="text-xs text-white/40">média(s) · {formatBytes(stats.bytes)}</p>
          </div>
        )}
      </div>

      <UploadDropzone
        accept={ACCEPT_BY_KIND.all}
        hint="Images JPG, PNG, WebP, GIF (5 Mo) · Vidéos MP4, WebM, MOV (80 Mo) · 3D GLB, GLTF, OBJ (40 Mo). Les métadonnées GPS des photos sont supprimées."
        items={uploads.items}
        busy={uploads.busy}
        onFiles={onFiles}
        onDismiss={uploads.dismiss}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Type de média" className="flex gap-1 rounded-xl border border-white/10 bg-[#0B0D10] p-1">
          {KIND_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={kind === t.key}
              onClick={() => setKind(t.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                kind === t.key ? "bg-[#C6A15B] text-[#0B0D10]" : "text-white/55 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, titre, tag)…"
            aria-label="Rechercher un média"
            className={`${INPUT} w-full sm:w-64`}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Trier" className={INPUT}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-xl border border-white/10 bg-[#0B0D10] p-1" role="group" aria-label="Affichage">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1 text-xs ${view === v ? "bg-white/10 text-white" : "text-white/45"}`}
              >
                {v === "grid" ? "Grille" : "Liste"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => (selecting ? exitSelection() : setSelecting(true))}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              selecting ? "border-[#C6A15B] text-[#E2C68E]" : "border-white/10 text-white/70 hover:border-white/25"
            }`}
          >
            {selecting ? "Terminer" : "Sélectionner"}
          </button>
        </div>
      </div>

      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm ${
            notice.kind === "error" ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          <span>{notice.text}</span>
          {forceIds && (
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulkDelete(forceIds, true)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-45"
            >
              Retirer et supprimer ({forceIds.length})
            </button>
          )}
        </div>
      )}

      {list.error ? (
        <p className="rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{list.error}</p>
      ) : list.loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/[.04]" />
          ))}
        </div>
      ) : list.items.length === 0 ? (
        <div className={`${CARD} p-10 text-center`}>
          <p className="font-medium">{q ? `Aucun média ne correspond à « ${q} ».` : "Aucun média pour l’instant."}</p>
          <p className="mt-1 text-sm text-white/45">
            {q ? "Essayez un autre mot ou un autre onglet." : "Glissez vos premiers fichiers dans la zone ci-dessus."}
          </p>
        </div>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {list.items.map((a) => {
            const isSelected = selected.has(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => (selecting ? toggle(a.id) : setOpenAsset(a))}
                  aria-pressed={selecting ? isSelected : undefined}
                  className={`group block w-full overflow-hidden rounded-2xl border text-left transition ${
                    isSelected ? "border-[#C6A15B] ring-2 ring-[#C6A15B]/40" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="relative aspect-square overflow-hidden bg-white/[.03]">
                    <AssetThumb asset={a} className="transition duration-300 group-hover:scale-[1.03]" />
                    {selecting && (
                      <span
                        className={`absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full border text-xs font-bold ${
                          isSelected ? "border-[#C6A15B] bg-[#C6A15B] text-[#0B0D10]" : "border-white/60 bg-black/40 text-transparent"
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-2">
                    <p className="truncate text-xs font-medium">{assetName(a)}</p>
                    <p className="mt-0.5 truncate text-[11px] text-white/40">
                      {KIND_LABEL[a.kind]} · {formatBytes(a.sizeBytes)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className={`${CARD} divide-y divide-white/10 overflow-hidden`}>
          {list.items.map((a) => {
            const isSelected = selected.has(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => (selecting ? toggle(a.id) : setOpenAsset(a))}
                  aria-pressed={selecting ? isSelected : undefined}
                  className={`flex w-full items-center gap-4 p-3 text-left transition hover:bg-white/[.03] ${isSelected ? "bg-[#C6A15B]/10" : ""}`}
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[.03]">
                    <AssetThumb asset={a} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{assetName(a)}</p>
                    <p className="mt-0.5 truncate text-xs text-white/40">
                      {KIND_LABEL[a.kind]} · {formatBytes(a.sizeBytes)}
                      {a.width && a.height ? ` · ${a.width}×${a.height}` : ""} · {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <span className="hidden shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/50 sm:inline">
                    {SOURCE_LABEL[a.source] ?? a.source}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div ref={sentinelRef} className="h-2" aria-hidden />
      {list.loadingMore && <p className="text-center text-sm text-white/40">Chargement…</p>}

      {selecting && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0B0D10]/95 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <strong>{selected.size}</strong> sélectionné(s)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelected(allVisibleSelected ? new Set() : new Set(list.items.map((i) => i.id)))}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/75"
              >
                {allVisibleSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
              <button
                type="button"
                disabled={selected.size === 0 || bulkBusy}
                onClick={() => {
                  if (window.confirm(`Supprimer ${selected.size} média(s) ?`)) bulkDelete([...selected], false);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-40"
              >
                {bulkBusy ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openAsset && (
        <AssetDetailsDialog
          asset={openAsset}
          onClose={() => setOpenAsset(null)}
          onChanged={(updated) => {
            setOpenAsset(updated);
            list.update((items) => items.map((i) => (i.id === updated.id ? updated : i)));
          }}
          onDeleted={(id) => {
            setOpenAsset(null);
            list.update((items) => items.filter((i) => i.id !== id));
            setNotice({ kind: "success", text: "Média supprimé." });
            reload();
          }}
        />
      )}
    </div>
  );
}
