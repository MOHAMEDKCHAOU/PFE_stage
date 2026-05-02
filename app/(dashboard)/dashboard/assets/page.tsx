"use client";

import type { UserAssetKind } from "@/generated/prisma";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type AssetRow = {
  id: string;
  url: string;
  kind: UserAssetKind;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

const TABS: { key: "all" | "image" | "video" | "3d"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "image", label: "Images" },
  { key: "video", label: "Vidéos" },
  { key: "3d", label: "3D" },
];

function formatBytes(n: number) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export default function AssetLibraryPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [items, setItems] = useState<AssetRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (cursor: string | null, append: boolean) => {
      const q = new URLSearchParams();
      if (tab !== "all") q.set("kind", tab);
      if (cursor) q.set("cursor", cursor);
      q.set("limit", "24");
      const r = await fetch(`/api/assets?${q}`, { credentials: "include" });
      if (!r.ok) return;
      const j = (await r.json()) as { items: AssetRow[]; nextCursor: string | null };
      setItems((prev) => (append ? [...prev, ...j.items] : j.items));
      setNextCursor(j.nextCursor);
    },
    [tab],
  );

  useEffect(() => {
    setLoading(true);
    void load(null, false).finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit || loadingMore || !nextCursor) return;
        setLoadingMore(true);
        void load(nextCursor, true).finally(() => setLoadingMore(false));
      },
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [load, nextCursor, loadingMore]);

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("type", "library");
        await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      }
      await load(null, false);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="pb-28">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Asset Library</h1>
          <p className="mt-1 text-sm text-stone-600">
            Hub centralisé — réutilisez vos médias dans plusieurs capsules.{" "}
            <Link href="/dashboard/space/wizard/templates" className="text-bordeaux-800 underline">
              Créer un Space
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              view === "grid" ? "bg-bordeaux-100 text-bordeaux-900 ring-1 ring-bordeaux-200" : "text-stone-600"
            }`}
          >
            Grille
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              view === "list" ? "bg-bordeaux-100 text-bordeaux-900 ring-1 ring-bordeaux-200" : "text-stone-600"
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-stone-200 bg-stone-100/80 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.key ? "bg-white text-bordeaux-900 shadow-sm" : "text-stone-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-center text-stone-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
          Aucun média pour l’instant. Utilisez « Ajouter des médias » ci-dessous.
        </p>
      ) : view === "grid" ? (
        <ul className="mt-6 columns-2 gap-3 sm:columns-3 md:columns-4">
          {items.map((a) => (
            <li key={a.id} className="mb-3 break-inside-avoid">
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm">
                {a.kind === "IMAGE" && (
                  <img src={a.url} alt="" className="w-full object-cover" loading="lazy" />
                )}
                {a.kind === "VIDEO" && (
                  <video src={a.url} className="w-full object-cover" muted playsInline preload="metadata" />
                )}
                {a.kind === "MODEL_3D" && (
                  <div className="flex aspect-video items-center justify-center bg-stone-200 text-sm text-stone-600">
                    3D
                  </div>
                )}
                <div className="px-2 py-1.5 text-[11px] text-stone-500">{formatBytes(a.sizeBytes)}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {a.kind === "IMAGE" && (
                  <img src={a.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
                {a.kind === "VIDEO" && (
                  <video src={a.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                )}
                {a.kind === "MODEL_3D" && (
                  <div className="flex h-full items-center justify-center text-xs text-stone-500">3D</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">{a.kind}</p>
                <p className="truncate text-xs text-stone-500">
                  {formatBytes(a.sizeBytes)} · {formatDate(a.createdAt)}
                </p>
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs font-medium text-bordeaux-800 underline"
              >
                Ouvrir
              </a>
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
      {loadingMore && <p className="py-4 text-center text-sm text-stone-500">Suite…</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,.glb,.gltf,.obj"
        multiple
        className="hidden"
        onChange={(e) => void onPickFiles(e.target.files)}
      />

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-[#f4efe6]/95 px-4 py-4 backdrop-blur-md lg:left-[260px]">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl bg-bordeaux-800 py-3.5 text-sm font-semibold text-white shadow-lg shadow-bordeaux-900/20 hover:bg-bordeaux-700 disabled:opacity-60"
          >
            {uploading ? "Upload…" : "Ajouter des médias"}
          </button>
        </div>
      </div>
    </div>
  );
}
