"use client";

import { useCallback, useEffect, useState } from "react";
import type { KindFilter, MediaAsset, SortKey } from "./media-types";

type Stats = { count: number; bytes: number };
type Page = { items: MediaAsset[]; nextCursor: string | null; stats: Stats | null; error: string | null };

async function fetchPage(kind: KindFilter, q: string, sort: SortKey, cursor: string | null): Promise<Page> {
  const params = new URLSearchParams({ kind, sort, limit: "24" });
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  try {
    const res = await fetch(`/api/assets?${params}`, { credentials: "include", cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { items: [], nextCursor: null, stats: null, error: typeof json.error === "string" ? json.error : "Chargement impossible." };
    }
    return { items: json.items ?? [], nextCursor: json.nextCursor ?? null, stats: json.stats ?? null, error: null };
  } catch {
    return { items: [], nextCursor: null, stats: null, error: "Serveur injoignable." };
  }
}

/**
 * Liste paginée des médias. Chaque réponse est rattachée à la « clé » des filtres qui l’a
 * demandée : une réponse arrivée après un changement d’onglet ou de recherche est ignorée.
 */
export function useAssetList(kind: KindFilter, q: string, sort: SortKey, reloadToken = 0) {
  const key = `${kind}|${q}|${sort}|${reloadToken}`;
  const [state, setState] = useState<Page & { key: string }>({ key: "", items: [], nextCursor: null, stats: null, error: null });
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPage(kind, q, sort, null).then((page) => {
      if (!cancelled) setState({ key, ...page });
    });
    return () => {
      cancelled = true;
    };
  }, [key, kind, q, sort]);

  const loadMore = useCallback(async () => {
    if (!state.nextCursor || loadingMore || state.key !== key) return;
    setLoadingMore(true);
    const page = await fetchPage(kind, q, sort, state.nextCursor);
    setState((s) =>
      s.key === key && !page.error
        ? { ...s, items: [...s.items, ...page.items.filter((p) => !s.items.some((i) => i.id === p.id))], nextCursor: page.nextCursor }
        : s,
    );
    setLoadingMore(false);
  }, [key, kind, q, sort, state.key, state.nextCursor, loadingMore]);

  /** Mise à jour locale après modification / suppression, sans tout recharger. */
  const update = useCallback((fn: (items: MediaAsset[]) => MediaAsset[]) => {
    setState((s) => ({ ...s, items: fn(s.items) }));
  }, []);

  return {
    items: state.key === key ? state.items : [],
    loading: state.key !== key,
    loadingMore,
    hasMore: state.key === key && Boolean(state.nextCursor),
    stats: state.stats,
    error: state.key === key ? state.error : null,
    loadMore,
    update,
  };
}
