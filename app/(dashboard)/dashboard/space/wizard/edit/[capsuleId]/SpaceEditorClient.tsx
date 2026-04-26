"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./space-editor.css";

const OPTION_COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#BA7517", "#185FA5", "#3B6D11"];

const THEME_SWATCHES = [
  { color: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" },
  { color: "linear-gradient(135deg, #1a3a2a, #0d2818)" },
  { color: "linear-gradient(135deg, #2a1a2a, #1a0a1a)" },
  { color: "linear-gradient(135deg, #1a2a3a, #0a1520)" },
];

type Branch = {
  id: string;
  headline: string;
  description: string;
  cta: string;
  proof: string | null;
};

type Opt = {
  id: string;
  label: string;
  sortOrder: number;
  branch: Branch | null;
};

type Cap = {
  id: string;
  title: string;
  objective: string;
  isPublished: boolean;
  layoutPreset: string | null;
  editorHotspots: unknown;
  options: Opt[];
  identity: {
    id: string;
    slug: string;
    name: string;
    type: string;
    headline: string | null;
    bio: string | null;
    theme: string | null;
    cover: string | null;
    avatar: string | null;
  };
};

type Tab = "add" | "arrange" | "hotspot" | "text" | "settings";

type HotspotEntry = { optionId: string; x: number; y: number; label?: string };

function parseHotspots(raw: string): { hotspots: HotspotEntry[] } {
  try {
    const p = JSON.parse(raw) as { hotspots?: HotspotEntry[] };
    if (p && Array.isArray(p.hotspots)) return { hotspots: p.hotspots };
  } catch {
    /* ignore */
  }
  return { hotspots: [] };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

export function SpaceEditorClient({ capsuleId }: { capsuleId: string }) {
  const [tab, setTab] = useState<Tab>("add");
  const [cap, setCap] = useState<Cap | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [idHeadline, setIdHeadline] = useState("");
  const [idBio, setIdBio] = useState("");
  const [hotspotDraft, setHotspotDraft] = useState<string>("");
  const [optLabel, setOptLabel] = useState("");
  const [br, setBr] = useState({ headline: "", description: "", cta: "" });
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showBranch, setShowBranch] = useState(false);
  const [canvasGradIndex, setCanvasGradIndex] = useState(0);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [assets, setAssets] = useState<string[]>([]);
  const [usedAsset, setUsedAsset] = useState(0);
  const [bHeadline, setBHeadline] = useState("");
  const [bDesc, setBDesc] = useState("");
  const [bCta, setBCta] = useState("");
  const [togglePub, setTogglePub] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }, []);

  const load = useCallback(() => {
    fetch(`/api/capsules?capsuleId=${encodeURIComponent(capsuleId)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((c: Cap | null) => {
        if (!c) {
          setLoadErr("Chargement impossible");
          return;
        }
        setCap(c);
        setTitle(c.title);
        setObjective(c.objective);
        setDisplayName(c.identity.name);
        setIdHeadline(c.identity.headline || "");
        setIdBio(c.identity.bio || "");
        setTogglePub(c.isPublished);
        setHotspotDraft(
          c.editorHotspots
            ? JSON.stringify(c.editorHotspots, null, 2)
            : JSON.stringify({ hotspots: [] as HotspotEntry[] }, null, 2),
        );
        const initialAssets = [c.identity.cover, c.identity.avatar].filter(
          (x): x is string => Boolean(x),
        );
        setAssets(initialAssets);
        setCoverPreview(c.identity.cover);
        setUsedAsset(0);
      });
  }, [capsuleId]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedOpt = useMemo(
    () =>
      cap
        ? [...cap.options].sort(
            (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
          )
        : [],
    [cap],
  );

  const hotspots = useMemo(() => parseHotspots(hotspotDraft).hotspots, [hotspotDraft]);

  useEffect(() => {
    if (!selectedOptionId) {
      setBHeadline("");
      setBDesc("");
      setBCta("");
      return;
    }
    const o = sortedOpt.find((x) => x.id === selectedOptionId);
    if (o?.branch) {
      setBHeadline(o.branch.headline);
      setBDesc(o.branch.description);
      setBCta(o.branch.cta);
    } else {
      setBHeadline("");
      setBDesc("");
      setBCta("");
    }
  }, [selectedOptionId, sortedOpt]);

  const selectOption = useCallback(
    (id: string) => {
      setSelectedOptionId(id);
      setShowBranch(true);
    },
    [],
  );

  const resetCanvas = useCallback(() => {
    setSelectedOptionId(null);
    setShowBranch(false);
  }, []);

  const saveCapsule = useCallback(async () => {
    if (!cap) return;
    setSaving(true);
    let hs: unknown;
    try {
      hs = JSON.parse(hotspotDraft);
    } catch {
      hs = { hotspots: [] };
    }
    try {
      await fetch("/api/capsules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: cap.id,
          title,
          objective,
          editorHotspots: hs,
          isPublished: togglePub,
        }),
      });
      await fetch("/api/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: cap.identity.id,
          name: displayName,
          type: cap.identity.type,
          headline: idHeadline || null,
          bio: idBio || null,
          cover: coverPreview,
          theme: cap.identity.theme,
        }),
      });
      if (selectedOptionId) {
        const o = sortedOpt.find((x) => x.id === selectedOptionId);
        if (o?.branch?.id) {
          await fetch("/api/branches", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              id: o.branch.id,
              headline: bHeadline,
              description: bDesc,
              cta: bCta,
            }),
          });
        }
      }
      setCap((c) =>
        c
          ? {
              ...c,
              title,
              objective,
              isPublished: togglePub,
              identity: {
                ...c.identity,
                name: displayName,
                headline: idHeadline,
                bio: idBio,
                cover: coverPreview,
              },
            }
          : c,
      );
      showToast("Capsule sauvegardée — brouillon mis à jour");
      load();
    } finally {
      setSaving(false);
    }
  }, [
    bCta,
    bDesc,
    bHeadline,
    cap,
    coverPreview,
    displayName,
    hotspotDraft,
    idBio,
    idHeadline,
    load,
    objective,
    selectedOptionId,
    showToast,
    sortedOpt,
    title,
    togglePub,
  ]);

  const publish = useCallback(async () => {
    if (!cap) return;
    setSaving(true);
    try {
      await fetch("/api/capsules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: cap.id, isPublished: true }),
      });
      setTogglePub(true);
      setCap((c) => (c ? { ...c, isPublished: true } : c));
      showToast("Capsule publiée ! Lien : /capsule/" + cap.identity.slug);
    } finally {
      setSaving(false);
    }
  }, [cap, showToast]);

  const addOption = useCallback(async () => {
    if (!cap || !optLabel.trim()) return;
    const oRes = await fetch("/api/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ capsuleId: cap.id, label: optLabel.trim() }),
    });
    if (!oRes.ok) return;
    const opt = (await oRes.json()) as { id: string };
    await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        optionId: opt.id,
        headline: br.headline || "Titre de branche",
        description: br.description || "Description",
        cta: br.cta || "Action",
        proof: null,
      }),
    });
    setOptLabel("");
    setBr({ headline: "", description: "", cta: "" });
    showToast("Option ajoutée — éditez le texte dans l’onglet Text");
    load();
  }, [br, cap, load, optLabel, showToast]);

  const move = useCallback(
    async (opt: Opt, dir: -1 | 1) => {
      const sorted = [...(cap?.options || [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
      );
      const i = sorted.findIndex((o) => o.id === opt.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= sorted.length) return;
      const s = [...sorted];
      [s[i], s[j]] = [s[j]!, s[i]!];
      for (let k = 0; k < s.length; k++) {
        await fetch("/api/options", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: s[k]!.id, sortOrder: k }),
        });
      }
      load();
    },
    [cap?.options, load],
  );

  const onCoverClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (tab !== "hotspot" || !selectedOptionId) {
        return;
      }
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
      const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
      const o = sortedOpt.find((a) => a.id === selectedOptionId);
      const next = {
        ...parseHotspots(hotspotDraft),
        hotspots: [
          ...parseHotspots(hotspotDraft).hotspots.filter((h) => h.optionId !== selectedOptionId),
          { optionId: selectedOptionId, x, y, label: o?.label },
        ],
      };
      setHotspotDraft(JSON.stringify(next, null, 2));
      showToast(`Hotspot à ${x}% / ${y}% — Save pour enregistrer`);
    },
    [hotspotDraft, selectedOptionId, showToast, sortedOpt, tab],
  );

  const onUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const fd = new FormData();
      fd.append("file", f);
      fd.append("type", "portfolio");
      const r = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (r.ok) {
        const j = (await r.json()) as { url?: string };
        if (j.url) {
          setAssets((a) => [...a, j.url!]);
          showToast("Asset ajouté");
        }
      }
      e.target.value = "";
    },
    [showToast],
  );

  if (loadErr || !cap) {
    return <p className="p-6 text-stone-600">{loadErr || "Chargement…"}</p>;
  }

  const coverImg = coverPreview || cap.identity.cover;
  const grad = THEME_SWATCHES[canvasGradIndex]?.color;

  return (
    <div className="space-editor-root space-editor pb-6">
      <div className="se-editor-wrap">
        <div className="se-topbar">
          <div className="se-topbar-left">
            <div className="se-avatar" aria-hidden>
              {cap.identity.avatar ? (
                <img
                  src={cap.identity.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(displayName || cap.identity.name)
              )}
            </div>
            <div>
              <div className="se-topbar-title">{displayName || cap.identity.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {!cap.isPublished && <span className="se-badge-draft">brouillon</span>}
                <span className="text-[11px] text-stone-500">
                  {cap.isPublished ? "publié" : "non publié"}
                </span>
              </div>
            </div>
          </div>
          <div className="se-topbar-actions">
            <button
              type="button"
              className="se-btn"
              onClick={saveCapsule}
              disabled={saving}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M5 2v4h6V2M5 10h6"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              Save
            </button>
            <Link
              href={`/dashboard/space/preview/${cap.id}`}
              target="_blank"
              className="se-btn"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5-3-5-6.5-5z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Preview
            </Link>
            <button
              type="button"
              className="se-btn se-btn-publish"
              onClick={publish}
              disabled={saving}
            >
              Publish
            </button>
          </div>
        </div>

        <div className="se-editor-body">
          <aside className="se-sidebar">
            <div className="se-tabs" role="tablist">
              {(
                [
                  ["add", "Add"],
                  ["arrange", "Arrange"],
                  ["hotspot", "Hotspot"],
                  ["text", "Text"],
                  ["settings", "Settings"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  className={"se-tab" + (tab === k ? " se-active" : "")}
                  onClick={() => setTab(k)}
                >
                  {l}
                </button>
              ))}
            </div>

            {tab === "add" && (
              <div className="se-panel">
                <div className="se-panel-section">
                  <div className="se-panel-label">Capsule</div>
                  <div className="se-field">
                    <label htmlFor="se-titre">Titre</label>
                    <input
                      id="se-titre"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="se-field">
                    <label htmlFor="se-obj">Objectif (question)</label>
                    <textarea
                      id="se-obj"
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                    />
                  </div>
                </div>
                <div className="se-panel-section">
                  <div className="se-panel-label">Options</div>
                  <div>
                    {sortedOpt.map((o, idx) => (
                      <button
                        key={o.id}
                        type="button"
                        className={
                          "se-option-item" + (selectedOptionId === o.id ? " se-selected" : "")
                        }
                        onClick={() => selectOption(o.id)}
                      >
                        <span
                          className="se-option-dot"
                          style={{ background: OPTION_COLORS[idx % OPTION_COLORS.length] }}
                        />
                        <span className="se-option-text">{o.label}</span>
                        <span className="se-option-arrow">›</span>
                      </button>
                    ))}
                  </div>
                  <div className="se-field">
                    <label htmlFor="se-nopt">Nouvelle option</label>
                    <input
                      id="se-nopt"
                      type="text"
                      value={optLabel}
                      onChange={(e) => setOptLabel(e.target.value)}
                      placeholder="Label…"
                    />
                  </div>
                  <div className="se-field">
                    <input
                      type="text"
                      value={br.headline}
                      onChange={(e) => setBr((b) => ({ ...b, headline: e.target.value }))}
                      placeholder="Headline"
                    />
                  </div>
                  <div className="se-field">
                    <textarea
                      value={br.description}
                      onChange={(e) => setBr((b) => ({ ...b, description: e.target.value }))}
                      placeholder="Description"
                    />
                  </div>
                  <div className="se-field">
                    <input
                      type="text"
                      value={br.cta}
                      onChange={(e) => setBr((b) => ({ ...b, cta: e.target.value }))}
                      placeholder="CTA"
                    />
                  </div>
                  <button type="button" className="se-add-block" onClick={addOption}>
                    <div className="se-add-icon">+</div>
                    Ajouter une option
                  </button>
                </div>
                <div className="se-panel-section">
                  <div className="se-panel-label">Éléments</div>
                  <div className="se-add-block" title="Bientôt">
                    <div className="se-add-icon" style={{ background: "#E6F1FB" }} />
                    Image / vidéo
                  </div>
                  <div className="se-add-block" title="Bientôt">
                    <div className="se-add-icon" style={{ background: "#EAF3DE" }} />
                    Bloc texte
                  </div>
                  <div className="se-add-block" title="Bientôt">
                    <div className="se-add-icon" style={{ background: "#FAEEDA" }} />
                    Lien / CTA
                  </div>
                </div>
              </div>
            )}

            {tab === "arrange" && (
              <div className="se-panel">
                <div className="se-panel-label">Ordre des options</div>
                <p className="se-arrange-hint">Déplacez avec ↑ / ↓ (persistance en base)</p>
                {sortedOpt.map((o, idx) => (
                  <div
                    key={o.id}
                    className="se-option-item"
                    style={{ cursor: "grab" }}
                  >
                    <span className="text-stone-400">⠿</span>
                    <span
                      className="se-option-dot"
                      style={{ background: OPTION_COLORS[idx % OPTION_COLORS.length] }}
                    />
                    <span className="se-option-text flex-1">{o.label}</span>
                    <span className="flex gap-0.5">
                      <button
                        type="button"
                        className="rounded border border-stone-200 px-1 text-[10px]"
                        onClick={() => move(o, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="rounded border border-stone-200 px-1 text-[10px]"
                        onClick={() => move(o, 1)}
                      >
                        ↓
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === "hotspot" && (
              <div className="se-panel">
                <div className="se-panel-label">Hotspots actifs</div>
                <p className="se-arrange-hint">
                  Sélectionnez une option (Add), puis cliquez sur le bandeau cover du canvas.
                </p>
                {hotspots.map((h) => {
                  const idx = sortedOpt.findIndex((o) => o.id === h.optionId);
                  const c =
                    idx >= 0
                      ? OPTION_COLORS[idx % OPTION_COLORS.length]
                      : "#7F77DD";
                  return (
                    <div
                      key={h.optionId + h.x + h.y}
                      className="se-option-item"
                      style={{ cursor: "default" }}
                    >
                      <span className="se-option-dot" style={{ background: c }} />
                      <span className="se-option-text">{h.label || h.optionId}</span>
                      <span className="text-[10px] text-stone-500">
                        x:{h.x}% y:{h.y}%
                      </span>
                    </div>
                  );
                })}
                <div className="se-field mt-2">
                  <label>JSON (avancé)</label>
                  <textarea
                    className="min-h-[120px] font-mono text-[11px]"
                    value={hotspotDraft}
                    onChange={(e) => setHotspotDraft(e.target.value)}
                  />
                </div>
              </div>
            )}

            {tab === "text" && (
              <div className="se-panel">
                <div className="se-panel-label">Édition texte</div>
                <div className="se-field">
                  <label htmlFor="se-dname">Nom affiché</label>
                  <input
                    id="se-dname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="se-field">
                  <label htmlFor="se-hd">Headline</label>
                  <input
                    id="se-hd"
                    value={idHeadline}
                    onChange={(e) => setIdHeadline(e.target.value)}
                  />
                </div>
                <div className="se-field">
                  <label htmlFor="se-bio">Bio courte</label>
                  <textarea id="se-bio" value={idBio} onChange={(e) => setIdBio(e.target.value)} />
                </div>
                <div className="se-panel-label mt-2">Branche sélectionnée</div>
                {selectedOptionId && (
                  <>
                    <div className="se-field">
                      <label>Headline branche</label>
                      <input
                        value={bHeadline}
                        onChange={(e) => setBHeadline(e.target.value)}
                      />
                    </div>
                    <div className="se-field">
                      <label>Description</label>
                      <textarea
                        value={bDesc}
                        onChange={(e) => setBDesc(e.target.value)}
                      />
                    </div>
                    <div className="se-field">
                      <label>CTA</label>
                      <input value={bCta} onChange={(e) => setBCta(e.target.value)} />
                    </div>
                  </>
                )}
                {!selectedOptionId && (
                  <p className="text-xs text-stone-500">Choisissez une option dans Add ou le canvas.</p>
                )}
              </div>
            )}

            {tab === "settings" && (
              <div className="se-panel">
                <div className="se-panel-label">Capsule & identité</div>
                <div className="se-field">
                  <label>Slug public</label>
                  <input readOnly value={cap.identity.slug} className="opacity-80" />
                </div>
                <div className="se-settings-row">
                  <span>Thème</span>
                  <span className="se-settings-val">
                    {cap.identity.theme || cap.layoutPreset || "—"}
                  </span>
                </div>
                <div className="se-settings-row">
                  <span>Publié</span>
                  <button
                    type="button"
                    className={"se-toggle" + (togglePub ? " se-on" : "")}
                    onClick={() => setTogglePub((v) => !v)}
                    aria-pressed={togglePub}
                  />
                </div>
                <div className="se-settings-row">
                  <span>Analytics</span>
                  <button
                    type="button"
                    className="se-toggle se-on"
                    title="Bientôt"
                    disabled
                    aria-label="Bientôt"
                  />
                </div>
                <div className="se-settings-row">
                  <span>Chatbot IA</span>
                  <button
                    type="button"
                    className="se-toggle se-on"
                    title="Bientôt"
                    disabled
                    aria-label="Bientôt"
                  />
                </div>
                <div className="se-panel-label mt-3">Export</div>
                <a
                  className="se-add-block"
                  href={`/capsule/${cap.identity.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="se-add-icon">⬇</span>
                  Voir public
                </a>
                <Link
                  href="/dashboard/identities"
                  className="se-add-block"
                  style={{ textDecoration: "none" }}
                >
                  <span className="se-add-icon">✎</span>
                  Identités
                </Link>
              </div>
            )}
          </aside>

          <div className="se-canvas-area">
            <div className="se-canvas-frame">
              <div
                className="se-canvas-cover relative cursor-default"
                onClick={onCoverClick}
                role="presentation"
              >
                {coverImg ? (
                  <img
                    src={coverImg}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-80"
                  />
                ) : null}
                <div
                  className="absolute inset-0"
                  style={{
                    background: coverImg
                      ? undefined
                      : grad,
                    opacity: coverImg ? 0.35 : 0.95,
                  }}
                />
                <div className="se-cover-overlay">
                  <div className="se-cover-avatar">
                    {cap.identity.avatar ? (
                      <img src={cap.identity.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(displayName)
                    )}
                  </div>
                  <div className="se-cover-name">{displayName}</div>
                  <div className="se-cover-headline line-clamp-2">
                    {idHeadline || "—"}
                  </div>
                </div>
                {hotspots.map((h) => {
                  const oi = sortedOpt.findIndex((o) => o.id === h.optionId);
                  const hb =
                    oi >= 0
                      ? OPTION_COLORS[oi % OPTION_COLORS.length]
                      : "#7F77DD";
                  return (
                    <div
                      key={h.optionId + String(h.x) + String(h.y)}
                      className="se-hotspot"
                      style={{
                        left: `${h.x}%`,
                        top: `${h.y}%`,
                        backgroundColor: hb,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectOption(h.optionId);
                      }}
                    >
                      <span className="se-hotspot-label">{h.label || "Hotspot"}</span>
                    </div>
                  );
                })}
              </div>

              <div className="se-canvas-content">
                <div className="se-canvas-question">
                  {objective || "—"}
                </div>
                <div className="se-canvas-options">
                  {sortedOpt.map((o, i) => (
                    <button
                      key={o.id}
                      type="button"
                      className={
                        "se-canvas-opt" + (selectedOptionId === o.id ? " se-selected" : "")
                      }
                      onClick={() => selectOption(o.id)}
                    >
                      <span>{o.label}</span>
                      <span className="se-canvas-opt-arrow">›</span>
                    </button>
                  ))}
                </div>
                {showBranch && selectedOptionId && (
                  <div className="se-branch-view se-visible">
                    <div className="se-branch-headline">{bHeadline}</div>
                    <div className="se-branch-desc">{bDesc}</div>
                    <div className="se-branch-cta">{bCta}</div>
                  </div>
                )}
              </div>

              <div className="se-canvas-bottom">
                <span className="se-canvas-stat">
                  {sortedOpt.length} option{sortedOpt.length !== 1 ? "s" : ""} ·{" "}
                  {selectedOptionId
                    ? `option ${(sortedOpt.findIndex((o) => o.id === selectedOptionId) + 1) || "?"}`
                    : "0"} sélection
                </span>
                <button
                  type="button"
                  className={"se-canvas-back" + (showBranch ? " se-visible" : "")}
                  onClick={resetCanvas}
                >
                  ← Retour
                </button>
              </div>
            </div>
          </div>

          <aside className="se-right-panel">
            <div className="se-rp-title">Assets</div>
            <div className="se-asset-grid">
              {assets.length === 0 && (
                <div className="col-span-2 text-center text-[11px] text-stone-500">
                  Aucun visuel
                </div>
              )}
              {assets.map((u, i) => (
                <button
                  key={u + i}
                  type="button"
                  className={"se-asset-thumb" + (usedAsset === i && coverPreview === u ? " se-used" : "")}
                  onClick={() => {
                    setUsedAsset(i);
                    setCoverPreview(u);
                  }}
                  title="Définir comme cover (Save)"
                >
                  {u.match(/\.(png|jpe?g|webp|gif)/i) ? (
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "📁"
                  )}
                </button>
              ))}
            </div>
            <label className="se-add-block cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
              <span>+</span> Upload
            </label>
            <div className="se-rp-title mt-3.5">Thème cover</div>
            <div className="mb-2 grid grid-cols-4 gap-1">
              {THEME_SWATCHES.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="h-5 cursor-pointer rounded border-2 p-0"
                  style={{
                    background: s.color,
                    borderColor: canvasGradIndex === i ? "#7F77DD" : "transparent",
                  }}
                  onClick={() => setCanvasGradIndex(i)}
                  title="Aperçu canvas (sans image)"
                />
              ))}
            </div>
            <div className="se-rp-title">Aperçu rapide</div>
            <p className="text-[11px] leading-relaxed text-stone-500">
              {sortedOpt.length} options
              <br />
              <span className={cap.isPublished ? "text-emerald-700" : "text-amber-800"}>
                {cap.isPublished ? "Publié" : "Brouillon"}
              </span>
              <br />
              <span className="text-stone-400">Slug :</span>
              <br />
              <code className="text-[10px] text-bordeaux-900">/capsule/{cap.identity.slug}</code>
            </p>
          </aside>
        </div>
      </div>

      {toast && <div className="se-toast" role="status">{toast}</div>}
    </div>
  );
}
