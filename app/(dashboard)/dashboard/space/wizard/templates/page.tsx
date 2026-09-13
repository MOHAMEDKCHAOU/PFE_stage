"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { spaceThemePresets, type SpaceThemeId, isSpaceThemeId } from "@/lib/space-themes";

type Identity = { id: string; name: string; theme: string | null };

function SpaceTemplatesContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [identityId, setIdentityId] = useState(sp.get("identityId") || "");
  const [selected, setSelected] = useState<SpaceThemeId>(
    (sp.get("theme") && isSpaceThemeId(sp.get("theme")!)) ? (sp.get("theme")! as SpaceThemeId) : "ocean",
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/identity", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length) {
          setIdentities(
            (data as { id: string; name: string; theme: string | null }[]).map((i) => ({
              id: i.id,
              name: i.name,
              theme: i.theme,
            })),
          );
          if (!sp.get("identityId")) {
            setIdentityId((data[0] as { id: string }).id);
          }
        }
      });
  }, [sp]);

  const preview = spaceThemePresets.find((p) => p.id === selected)!;

  const onStart = useCallback(async () => {
    if (!identityId) {
      setErr("Sélectionnez une identité.");
      return;
    }
    setErr("");
    setSaving(true);
    try {
      const themeToSave = selected === "default" ? null : selected;
      const res = await fetch("/api/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: identityId,
          theme: themeToSave,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr((j as { error?: string }).error || "Sauvegarde impossible");
        return;
      }
      const layout = selected === "default" ? "ocean" : selected;
      router.push(
        `/dashboard/space/wizard/create?identityId=${encodeURIComponent(identityId)}&theme=${encodeURIComponent(layout)}`,
      );
    } finally {
      setSaving(false);
    }
  }, [identityId, router, selected]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-2">
        <Link
          href="/dashboard/capsules"
          className="text-sm text-bordeaux-800 hover:underline"
        >
          ← Capsules
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Space — choisir un thème</h1>
      <p className="mt-2 text-zinc-400">
        Un modèle visuel pour votre capsule (aligné sur les thèmes Faymoos). Aperçu en direct avant
        d’alimenter le contenu.
      </p>

      {identities.length === 0 && (
        <p className="mt-6 rounded-lg border border-[#C6A15B]/30 bg-[#C6A15B]/10 px-4 py-3 text-sm text-[#C6A15B]">
          Créez d’abord une identité dans{" "}
          <Link href="/dashboard/identities" className="font-semibold underline">
            Identités
          </Link>
          .
        </p>
      )}

      {identities.length > 0 && (
        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-300">Identité cible</label>
          <select
            className="mt-1 w-full max-w-md rounded-lg border border-white/10 bg-zinc-900/45 px-3 py-2 text-foreground"
            value={identityId}
            onChange={(e) => setIdentityId(e.target.value)}
          >
            {identities.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {err && <p className="mt-4 text-sm text-[#C6A15B]">{err}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Préréglages
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2">
            {spaceThemePresets.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`flex w-full flex-col rounded-xl border-2 p-3 text-left transition ${
                    selected === p.id
                      ? "border-bordeaux-600 bg-bordeaux-50/50"
                      : "border-white/10 bg-zinc-900/45 hover:border-bordeaux-200"
                  }`}
                >
                  <div
                    className={`h-10 rounded-lg bg-gradient-to-br ${p.preview.gradient} opacity-90`}
                  />
                  <span className="mt-2 text-sm font-semibold text-foreground">{p.name}</span>
                  <span className="line-clamp-2 text-xs text-zinc-500">{p.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Aperçu</h2>
          <div
            className={`mt-3 min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-1 shadow-lg`}
          >
            <div
              className={`flex h-40 flex-col justify-end rounded-t-xl bg-gradient-to-br ${preview.preview.gradient} p-4`}
            >
              <div className="h-2 w-24 rounded bg-zinc-900/30" />
            </div>
            <div className="space-y-2 p-4 text-white">
              <div className="h-2 w-3/4 rounded bg-zinc-900/20" />
              <div className="h-2 w-1/2 rounded bg-zinc-900/10" />
              <div className="mt-4 flex gap-2">
                <div className="h-8 flex-1 rounded-lg bg-zinc-900/20" />
                <div className="h-8 flex-1 rounded-lg bg-zinc-900/20" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Le thème est appliqué à l’identité (`theme`) et repris par la visionneuse publique.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-6">
        <Link
          href="/dashboard/space/wizard/create"
          className="text-sm text-zinc-500 hover:text-foreground"
        >
          Passer l’aperçu (déconseillé)
        </Link>
        <button
          type="button"
          onClick={onStart}
          disabled={saving || !identityId}
          className="inline-flex min-w-[180px] items-center justify-center rounded-xl bg-bordeaux-800 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-bordeaux-700 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Start building →"}
        </button>
      </div>
    </div>
  );
}

export default function SpaceTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-zinc-500">
          Chargement du thème…
        </div>
      }
    >
      <SpaceTemplatesContent />
    </Suspense>
  );
}
