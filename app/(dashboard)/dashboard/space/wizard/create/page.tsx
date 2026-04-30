"use client";

import { ScanCaptureWorkflow } from "@/components/ScanCaptureWorkflow";
import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type AiOption = {
  label: string;
  branch: { headline: string; description: string; cta: string; proof?: string };
};

type AiPayload = { title: string; objective: string; options: AiOption[] };

function SpaceCreatePageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const identityId = sp.get("identityId") || "";
  const themeQ = sp.get("theme") || "ocean";

  const [tab, setTab] = useState<"scan" | "upload" | "ia">("upload");
  const [assets, setAssets] = useState<string[]>([]);
  const [iaPrompt, setIaPrompt] = useState("");
  const [aiData, setAiData] = useState<AiPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const onUpload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setErr("");
      const next: string[] = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("type", "portfolio");
        const r = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
        if (r.ok) {
          const j = (await r.json()) as { url?: string };
          if (j.url) next.push(j.url);
        }
      }
      setAssets((a) => [...a, ...next]);
    },
    [],
  );

  const runAi = useCallback(async () => {
    if (iaPrompt.trim().length < 5) {
      setErr("Décrivez votre activité (5 caractères min.)");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/ai/generate-capsule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description: iaPrompt.trim() }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr((j as { error?: string }).error || "Échec IA");
        return;
      }
      const j = (await r.json()) as AiPayload;
      setAiData(j);
      setTab("ia");
    } catch {
      setErr("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [iaPrompt]);

  const onContinue = useCallback(async () => {
    if (!identityId) {
      setErr("Paramètre manquant : identityId. Repassez par les templates.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const title = aiData?.title?.trim() || "Ma capsule";
      const objective =
        aiData?.objective?.trim() || "Quelle piste souhaitez-vous explorer avec moi ?";
      const layoutPresetVal = themeQ || "ocean";

      const cRes = await fetch("/api/capsules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identityId,
          title,
          objective,
          isPublished: false,
          layoutPreset: layoutPresetVal,
        }),
      });
      if (!cRes.ok) {
        const j = await cRes.json().catch(() => ({}));
        setErr((j as { error?: string }).error || "Création capsule refusée");
        return;
      }
      const cap = (await cRes.json()) as { id: string };

      if (aiData?.options?.length) {
        for (let i = 0; i < aiData.options.length; i++) {
          const o = aiData.options[i]!;
          const oRes = await fetch("/api/options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ capsuleId: cap.id, label: o.label, sortOrder: i }),
          });
          if (!oRes.ok) continue;
          const opt = (await oRes.json()) as { id: string };
          await fetch("/api/branches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              optionId: opt.id,
              headline: o.branch.headline,
              description: o.branch.description,
              cta: o.branch.cta,
              proof: o.branch.proof || null,
            }),
          });
        }
      }

      if (assets.length) {
        await fetch("/api/identity", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: identityId,
            cover: assets[0] ?? undefined,
            avatar: assets[1] ?? undefined,
          }),
        });
      }

      router.push(`/dashboard/space/wizard/edit/${cap.id}`);
    } finally {
      setLoading(false);
    }
  }, [aiData, assets, identityId, router, themeQ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-2">
        <Link
          href={`/dashboard/space/wizard/templates${identityId ? `?identityId=${encodeURIComponent(identityId)}` : ""}`}
          className="text-sm text-bordeaux-800 hover:underline"
        >
          ← Thèmes
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-stone-900">Create Space</h1>
      <p className="mt-2 text-stone-600">
        Alimenter la capsule : scan, fichiers, ou génération IA. Puis enregistrement en brouillon et
        ouverture de l’éditeur.
      </p>

      {!identityId && (
        <p className="mt-4 text-sm text-amber-800">
          Aucun `identityId` :{" "}
          <Link className="underline" href="/dashboard/space/wizard/templates">
            choisir un thème
          </Link>
          .
        </p>
      )}

      <div className="mt-6 flex gap-1 rounded-xl border border-stone-200 bg-stone-100/80 p-1">
        {(
          [
            ["scan", "Scan (caméra)"],
            ["upload", "Upload"],
            ["ia", "IA generate"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              tab === k ? "bg-white text-bordeaux-900 shadow-sm" : "text-stone-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

      {tab === "scan" && (
        <div className="mt-6 space-y-4 rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center">
          <p className="text-sm text-stone-600">
            Scan plein écran (caméra + aperçu + validation) ou fichier local.
          </p>
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="w-full rounded-xl bg-bordeaux-800 py-3 text-sm font-semibold text-white hover:bg-bordeaux-700 sm:w-auto sm:px-8"
          >
            Ouvrir le scan
          </button>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="block w-full text-sm"
            onChange={(e) => onUpload(e.target.files)}
          />
          <ScanCaptureWorkflow
            open={scanOpen}
            onClose={() => setScanOpen(false)}
            onUseScan={async (file) => {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("type", "portfolio");
              const r = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
              if (!r.ok) {
                const j = (await r.json().catch(() => ({}))) as { error?: string };
                throw new Error(j.error || "Upload refusé");
              }
              const j = (await r.json()) as { url?: string };
              if (j.url) setAssets((a) => [...a, j.url!]);
            }}
          />
        </div>
      )}

      {tab === "upload" && (
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-6">
          <p className="text-sm text-stone-600">Images (portfolio) — serviront de cover / visuels.</p>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="mt-4 block w-full text-sm"
            onChange={(e) => onUpload(e.target.files)}
          />
        </div>
      )}

      {tab === "ia" && (
        <div className="mt-6 space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <label className="text-sm font-medium text-stone-800">Décrivez votre offre</label>
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900"
            placeholder="Ex. Designer UX freelance spécialisé apps mobiles B2B…"
            value={iaPrompt}
            onChange={(e) => setIaPrompt(e.target.value)}
          />
          <button
            type="button"
            onClick={runAi}
            disabled={loading}
            className="rounded-lg bg-bordeaux-800 px-4 py-2 text-sm text-white hover:bg-bordeaux-700"
          >
            {loading ? "Génération…" : "Générer la structure (GPT-4o-mini)"}
          </button>
          {aiData && (
            <pre className="max-h-48 overflow-auto rounded bg-stone-100 p-3 text-xs text-stone-800">
              {JSON.stringify({ title: aiData.title, objective: aiData.objective, n: aiData.options.length }, null, 2)}
            </pre>
          )}
        </div>
      )}

      {assets.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-stone-700">Sélection courante</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {assets.map((u) => (
              <li
                key={u}
                className="h-16 w-16 overflow-hidden rounded border border-stone-200 bg-stone-100"
              >
                {/\.(mp4|webm|mov)(\?|$)/i.test(u) ? (
                  <video src={u} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={u} alt="" className="h-full w-full object-cover" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={loading || !identityId}
          className="rounded-xl bg-bordeaux-800 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Création…" : "Continue — créer la capsule (brouillon)"}
        </button>
      </div>
    </div>
  );
}

export default function SpaceCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-stone-500">
          Chargement…
        </div>
      }
    >
      <SpaceCreatePageContent />
    </Suspense>
  );
}
