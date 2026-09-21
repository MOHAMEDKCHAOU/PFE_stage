"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import "./space-editor.css";
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
  sortOrder: number;
  branch: Branch | null;
};

type Identity = {
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

type Capsule = {
  id: string;
  title: string;
  objective: string;
  isPublished: boolean;
  commentsEnabled: boolean;
  layoutPreset: string | null;
  editorHotspots: unknown;
  options: Option[];
  identity: Identity;
};

type Hotspot = {
  optionId: string;
  x: number;
  y: number;
  label?: string;
};

type Tab =
  | "overview"
  | "identity"
  | "options"
  | "arrange"
  | "hotspots"
  | "design"
  | "settings";

type BranchDraft = {
  headline: string;
  description: string;
  cta: string;
  proof: string;
};

const TABS: Array<{
  id: Tab;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "Informations générales",
    icon: "⌂",
  },
  {
    id: "identity",
    label: "Identity",
    description: "Présence publique",
    icon: "◉",
  },
  {
    id: "options",
    label: "Options",
    description: "Parcours & branches",
    icon: "◇",
  },
  {
    id: "arrange",
    label: "Arrange",
    description: "Ordre des parcours",
    icon: "☷",
  },
  {
    id: "hotspots",
    label: "Hotspots",
    description: "Interactions visuelles",
    icon: "⌖",
  },
  {
    id: "design",
    label: "Design",
    description: "Cover & médias",
    icon: "▧",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Publication",
    icon: "⚙",
  },
];

const GRADIENTS = [
  "linear-gradient(135deg, #0B0D10 0%, #1B2028 100%)",
  "linear-gradient(135deg, #18130D 0%, #5A4522 100%)",
  "linear-gradient(135deg, #11151A 0%, #30404A 100%)",
  "linear-gradient(135deg, #241A17 0%, #5D3828 100%)",
];

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "F"
  );
}

function parseHotspots(raw: unknown): Hotspot[] {
  if (!raw || typeof raw !== "object") return [];

  const value = raw as { hotspots?: unknown };

  if (!Array.isArray(value.hotspots)) return [];

  return value.hotspots.filter(
    (item): item is Hotspot =>
      Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as Hotspot).optionId === "string" &&
          typeof (item as Hotspot).x === "number" &&
          typeof (item as Hotspot).y === "number",
      ),
  );
}

export function SpaceStudioClient({
  capsuleId,
}: {
  capsuleId: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  /* ------------------------------------------------------------------
   * Capsule
   * ---------------------------------------------------------------- */

  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");

  /* ------------------------------------------------------------------
   * Identity
   * ---------------------------------------------------------------- */

  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  /* ------------------------------------------------------------------
   * Options / branch
   * ---------------------------------------------------------------- */

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    null,
  );

  const [newOptionLabel, setNewOptionLabel] = useState("");

  const [newBranch, setNewBranch] = useState<BranchDraft>({
    headline: "",
    description: "",
    cta: "",
    proof: "",
  });

  const [branchDraft, setBranchDraft] = useState<BranchDraft>({
    headline: "",
    description: "",
    cta: "",
    proof: "",
  });

  /* ------------------------------------------------------------------
   * Publication
   * ---------------------------------------------------------------- */

  const [published, setPublished] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  /* ------------------------------------------------------------------
   * Design
   * ---------------------------------------------------------------- */

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [gradientIndex, setGradientIndex] = useState(0);
  const [assets, setAssets] = useState<string[]>([]);

  /* ------------------------------------------------------------------
   * Hotspots
   * ---------------------------------------------------------------- */

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  /* ------------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------------- */

  const notify = useCallback((message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2600);
  }, []);

  const sortedOptions = useMemo(() => {
    if (!capsule) return [];

    return [...capsule.options].sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
    );
  }, [capsule]);

  const selectedOption = useMemo(
    () =>
      sortedOptions.find(
        (option) => option.id === selectedOptionId,
      ) || null,
    [selectedOptionId, sortedOptions],
  );

  const completion = useMemo(() => {
    if (!capsule) return 0;

    const checks = [
      Boolean(title.trim()),
      Boolean(objective.trim()),
      Boolean(displayName.trim()),
      Boolean(headline.trim()),
      Boolean(bio.trim()),
      sortedOptions.length > 0,
      sortedOptions.every((option) => Boolean(option.branch)),
      Boolean(coverPreview),
    ];

    const completed = checks.filter(Boolean).length;

    return Math.round((completed / checks.length) * 100);
  }, [
    capsule,
    title,
    objective,
    displayName,
    headline,
    bio,
    sortedOptions,
    coverPreview,
  ]);

  /* ------------------------------------------------------------------
   * Load
   * ---------------------------------------------------------------- */

  const loadCapsule = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/capsules?capsuleId=${encodeURIComponent(capsuleId)}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Impossible de charger la capsule.");
      }

      const data = (await response.json()) as Capsule;

      setCapsule(data);

      setTitle(data.title || "");
      setObjective(data.objective || "");

      setDisplayName(data.identity.name || "");
      setHeadline(data.identity.headline || "");
      setBio(data.identity.bio || "");

      setPublished(Boolean(data.isPublished));
      setCommentsEnabled(data.commentsEnabled !== false);

      setCoverPreview(data.identity.cover || null);

      setAssets(
        [data.identity.cover, data.identity.avatar].filter(
          (value): value is string => Boolean(value),
        ),
      );

      setHotspots(parseHotspots(data.editorHotspots));

      if (data.options.length > 0) {
        const first = [...data.options].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        )[0];

        setSelectedOptionId(first.id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur de chargement.",
      );
    } finally {
      setLoading(false);
    }
  }, [capsuleId]);

  useEffect(() => {
    void loadCapsule();
  }, [loadCapsule]);

  /* ------------------------------------------------------------------
   * Select option
   * ---------------------------------------------------------------- */

  useEffect(() => {
    if (!selectedOption) {
      setBranchDraft({
        headline: "",
        description: "",
        cta: "",
        proof: "",
      });
      return;
    }

    if (!selectedOption.branch) {
      setBranchDraft({
        headline: "",
        description: "",
        cta: "",
        proof: "",
      });
      return;
    }

    setBranchDraft({
      headline: selectedOption.branch.headline || "",
      description: selectedOption.branch.description || "",
      cta: selectedOption.branch.cta || "",
      proof: selectedOption.branch.proof || "",
    });
  }, [selectedOption]);

  /* ------------------------------------------------------------------
   * Save
   * ---------------------------------------------------------------- */

  const save = useCallback(async () => {
    if (!capsule) return;

    setSaving(true);

    try {
      const capsuleResponse = await fetch("/api/capsules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: capsule.id,
          title,
          objective,
          isPublished: published,
          commentsEnabled,
          editorHotspots: {
            hotspots,
          },
        }),
      });

      if (!capsuleResponse.ok) {
        throw new Error("La capsule n'a pas pu être sauvegardée.");
      }

      const identityResponse = await fetch("/api/identity", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: capsule.identity.id,
          name: displayName,
          type: capsule.identity.type,
          headline: headline || null,
          bio: bio || null,
          cover: coverPreview,
          theme: capsule.identity.theme,
        }),
      });

      if (!identityResponse.ok) {
        throw new Error("L'identité n'a pas pu être sauvegardée.");
      }

      if (selectedOption?.branch) {
        const branchResponse = await fetch("/api/branches", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            id: selectedOption.branch.id,
            headline: branchDraft.headline,
            description: branchDraft.description,
            cta: branchDraft.cta,
            proof: branchDraft.proof || null,
          }),
        });

        if (!branchResponse.ok) {
          throw new Error(
            "La branche n'a pas pu être sauvegardée.",
          );
        }
      }

      setCapsule((current) =>
        current
          ? {
              ...current,
              title,
              objective,
              isPublished: published,
              commentsEnabled,
              editorHotspots: { hotspots },
              identity: {
                ...current.identity,
                name: displayName,
                headline,
                bio,
                cover: coverPreview,
              },
            }
          : current,
      );

      notify("✓ Capsule sauvegardée");
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Erreur pendant la sauvegarde.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    capsule,
    title,
    objective,
    published,
    commentsEnabled,
    hotspots,
    displayName,
    headline,
    bio,
    coverPreview,
    selectedOption,
    branchDraft,
    notify,
  ]);

  /* ------------------------------------------------------------------
   * Publish
   * ---------------------------------------------------------------- */

  const publish = useCallback(async () => {
    if (!capsule) return;

    setSaving(true);

    try {
      const response = await fetch("/api/capsules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: capsule.id,
          isPublished: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Publication impossible.");
      }

      setPublished(true);

      setCapsule((current) =>
        current
          ? {
              ...current,
              isPublished: true,
            }
          : current,
      );

      notify("✓ Capsule publiée");
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Publication impossible.",
      );
    } finally {
      setSaving(false);
    }
  }, [capsule, notify]);

  /* ------------------------------------------------------------------
   * Add option + branch
   * ---------------------------------------------------------------- */

  const addOption = useCallback(async () => {
    if (!capsule || !newOptionLabel.trim()) return;

    setSaving(true);

    try {
      const optionResponse = await fetch("/api/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          capsuleId: capsule.id,
          label: newOptionLabel.trim(),
        }),
      });

      if (!optionResponse.ok) {
        throw new Error("Impossible d'ajouter l'option.");
      }

      const option = (await optionResponse.json()) as {
        id: string;
      };

      const branchResponse = await fetch("/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          optionId: option.id,
          headline:
            newBranch.headline.trim() ||
            "Titre de branche",
          description:
            newBranch.description.trim() ||
            "Description de la branche",
          cta: newBranch.cta.trim() || "En savoir plus",
          proof: newBranch.proof.trim() || null,
        }),
      });

      if (!branchResponse.ok) {
        throw new Error(
          "L'option a été créée mais sa branche n'a pas pu être créée.",
        );
      }

      setNewOptionLabel("");

      setNewBranch({
        headline: "",
        description: "",
        cta: "",
        proof: "",
      });

      await loadCapsule();

      notify("✓ Option et branche ajoutées");
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Erreur pendant la création.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    capsule,
    newOptionLabel,
    newBranch,
    loadCapsule,
    notify,
  ]);

  /* ------------------------------------------------------------------
   * Move option
   * ---------------------------------------------------------------- */

  const moveOption = useCallback(
    async (option: Option, direction: -1 | 1) => {
      const index = sortedOptions.findIndex(
        (item) => item.id === option.id,
      );

      const target = index + direction;

      if (
        index < 0 ||
        target < 0 ||
        target >= sortedOptions.length
      ) {
        return;
      }

      const next = [...sortedOptions];

      [next[index], next[target]] = [
        next[target],
        next[index],
      ];

      setSaving(true);

      try {
        for (let i = 0; i < next.length; i += 1) {
          await fetch("/api/options", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              id: next[i].id,
              sortOrder: i,
            }),
          });
        }

        await loadCapsule();
        notify("✓ Ordre mis à jour");
      } finally {
        setSaving(false);
      }
    },
    [sortedOptions, loadCapsule, notify],
  );

  /* ------------------------------------------------------------------
   * Upload cover
   * ---------------------------------------------------------------- */

  const uploadAsset = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      setSaving(true);

      try {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("type", "portfolio");

        const response = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload impossible.");
        }

        const data = (await response.json()) as {
          url?: string;
        };

        if (data.url) {
          setAssets((current) => [...current, data.url!]);
          setCoverPreview(data.url);

          notify("✓ Image ajoutée et utilisée comme cover");
        }
      } catch (err) {
        notify(
          err instanceof Error
            ? err.message
            : "Upload impossible.",
        );
      } finally {
        setSaving(false);
        event.target.value = "";
      }
    },
    [notify],
  );

  /* ------------------------------------------------------------------
   * Hotspot
   * ---------------------------------------------------------------- */

  const addHotspot = useCallback(
    (x: number, y: number) => {
      if (!selectedOption) {
        notify("Sélectionnez d'abord une option.");
        return;
      }

      const next: Hotspot[] = [
        ...hotspots.filter(
          (item) => item.optionId !== selectedOption.id,
        ),
        {
          optionId: selectedOption.id,
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          label: selectedOption.label,
        },
      ];

      setHotspots(next);

      notify("Hotspot ajouté — cliquez sur Save");
    },
    [selectedOption, hotspots, notify],
  );

  /* ------------------------------------------------------------------
   * Render states
   * ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="space-studio-loading">
        <div className="se-loading-spinner" />
        <p>Chargement du Space Studio…</p>
      </div>
    );
  }

  if (error || !capsule) {
    return (
      <div className="space-studio-error">
        <h2>Impossible de charger le Studio</h2>
        <p>{error || "Capsule introuvable."}</p>

        <Link href="/dashboard/capsules">
          ← Retour aux capsules
        </Link>
      </div>
    );
  }

  const cover = coverPreview || capsule.identity.cover;

  return (
    <div className="space-studio-root">
      {/* ================================================================
          HEADER
      ================================================================= */}

      <header className="ss-topbar">
        <div className="ss-topbar-brand">
          <Link
            href="/dashboard/capsules"
            className="ss-back-link"
          >
            ← Capsules
          </Link>

          <div className="ss-title-block">
            <div className="ss-title-row">
              <h1>Space Studio</h1>

              <span
                className={
                  published
                    ? "ss-status ss-status-published"
                    : "ss-status ss-status-draft"
                }
              >
                <span className="ss-status-dot" />
                {published ? "Publié" : "Brouillon"}
              </span>
            </div>

            <p>{title || "Capsule sans titre"}</p>
          </div>
        </div>

        <div className="ss-topbar-actions">
          <div className="ss-save-state">
            {saving ? "Sauvegarde…" : "● Enregistré"}
          </div>

          <Link
            href={`/dashboard/space/preview/${capsule.id}`}
            target="_blank"
            className="ss-button ss-button-secondary"
          >
            ◉ Preview
          </Link>

          <button
            type="button"
            className="ss-button ss-button-secondary"
            onClick={() => void save()}
            disabled={saving}
          >
            Save
          </button>

          <button
            type="button"
            className="ss-button ss-button-primary"
            onClick={() => void publish()}
            disabled={saving || published}
          >
            {published ? "Published" : "Publish"}
          </button>
        </div>
      </header>

      {/* ================================================================
          BODY
      ================================================================= */}

      <div className="ss-layout">

        {/* ============================================================
            LEFT SIDEBAR
        ============================================================= */}

        <aside className="ss-sidebar">

          <div className="ss-sidebar-heading">
            <span>Studio</span>
            <small>{completion}% complete</small>
          </div>

          <div className="ss-progress">
            <span style={{ width: `${completion}%` }} />
          </div>

          <nav className="ss-navigation">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  tab === item.id
                    ? "ss-nav-item ss-nav-active"
                    : "ss-nav-item"
                }
                onClick={() => setTab(item.id)}
              >
                <span className="ss-nav-icon">
                  {item.icon}
                </span>

                <span className="ss-nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>

                {tab === item.id && (
                  <span className="ss-nav-arrow">›</span>
                )}
              </button>
            ))}
          </nav>

          <div className="ss-sidebar-bottom">
            <div className="ss-mini-status">
              <span className="ss-mini-avatar">
                {capsule.identity.avatar ? (
                  <img
                    src={capsule.identity.avatar}
                    alt=""
                  />
                ) : (
                  initials(displayName)
                )}
              </span>

              <div>
                <strong>
                  {displayName || capsule.identity.name}
                </strong>
                <small>Faymoos Identity</small>
              </div>
            </div>
          </div>
        </aside>

        {/* ============================================================
            EDITOR PANEL
        ============================================================= */}

        <main className="ss-editor">

          {/* ------------------------------------------------------------
              OVERVIEW
          ------------------------------------------------------------- */}

          {tab === "overview" && (
            <section className="ss-section">
              <div className="ss-section-header">
                <div>
                  <span className="ss-eyebrow">
                    CAPSULE
                  </span>

                  <h2>Build your experience</h2>

                  <p>
                    Définissez le contenu principal de votre
                    capsule avant de configurer les parcours.
                  </p>
                </div>
              </div>

              <div className="ss-card">
                <div className="ss-card-header">
                  <div>
                    <h3>Informations générales</h3>
                    <p>
                      Ces informations apparaissent au début
                      de votre expérience.
                    </p>
                  </div>
                </div>

                <div className="ss-form-grid">
                  <div className="ss-field ss-field-full">
                    <label htmlFor="ss-title">
                      Titre de la capsule
                      <span>*</span>
                    </label>

                    <input
                      id="ss-title"
                      value={title}
                      onChange={(event) =>
                        setTitle(event.target.value)
                      }
                      placeholder="Ex. Parlons de votre projet"
                    />

                    <small>
                      Le titre interne et public de votre
                      expérience.
                    </small>
                  </div>

                  <div className="ss-field ss-field-full">
                    <label htmlFor="ss-objective">
                      Question / objectif
                      <span>*</span>
                    </label>

                    <textarea
                      id="ss-objective"
                      value={objective}
                      onChange={(event) =>
                        setObjective(event.target.value)
                      }
                      placeholder="Quelle piste souhaitez-vous explorer avec moi ?"
                      rows={4}
                    />

                    <small>
                      Cette question guide le visiteur vers
                      le bon parcours.
                    </small>
                  </div>
                </div>
              </div>

              <div className="ss-card ss-card-highlight">
                <div className="ss-card-header">
                  <div>
                    <h3>État de la capsule</h3>
                    <p>
                      Vérifiez les éléments nécessaires avant
                      publication.
                    </p>
                  </div>

                  <strong className="ss-completion">
                    {completion}%
                  </strong>
                </div>

                <div className="ss-checklist">
                  <CheckItem
                    checked={Boolean(title.trim())}
                    label="Titre"
                  />

                  <CheckItem
                    checked={Boolean(objective.trim())}
                    label="Objectif"
                  />

                  <CheckItem
                    checked={Boolean(displayName.trim())}
                    label="Identité"
                  />

                  <CheckItem
                    checked={Boolean(coverPreview)}
                    label="Cover"
                  />

                  <CheckItem
                    checked={sortedOptions.length > 0}
                    label="Au moins une option"
                  />

                  <CheckItem
                    checked={
                      sortedOptions.length > 0 &&
                      sortedOptions.every(
                        (option) => Boolean(option.branch),
                      )
                    }
                    label="Branches configurées"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ------------------------------------------------------------
              IDENTITY
          ------------------------------------------------------------- */}

          {tab === "identity" && (
            <section className="ss-section">
              <SectionIntro
                eyebrow="IDENTITY"
                title="Votre présence"
                description="Configurez les informations professionnelles affichées dans la capsule."
              />

              <div className="ss-card">
                <div className="ss-identity-preview">
                  <div className="ss-large-avatar">
                    {capsule.identity.avatar ? (
                      <img
                        src={capsule.identity.avatar}
                        alt=""
                      />
                    ) : (
                      initials(displayName)
                    )}
                  </div>

                  <div>
                    <strong>
                      {displayName || "Votre nom"}
                    </strong>

                    <span>
                      {headline || "Votre headline"}
                    </span>
                  </div>
                </div>

                <div className="ss-form-grid">
                  <div className="ss-field">
                    <label htmlFor="ss-name">
                      Nom affiché
                      <span>*</span>
                    </label>

                    <input
                      id="ss-name"
                      value={displayName}
                      onChange={(event) =>
                        setDisplayName(event.target.value)
                      }
                      placeholder="Mohamed Amin Kchaou"
                    />
                  </div>

                  <div className="ss-field">
                    <label htmlFor="ss-headline">
                      Headline
                    </label>

                    <input
                      id="ss-headline"
                      value={headline}
                      onChange={(event) =>
                        setHeadline(event.target.value)
                      }
                      placeholder="Développeur Full-Stack & Data Scientist"
                    />
                  </div>

                  <div className="ss-field ss-field-full">
                    <label htmlFor="ss-bio">
                      Bio
                    </label>

                    <textarea
                      id="ss-bio"
                      value={bio}
                      onChange={(event) =>
                        setBio(event.target.value)
                      }
                      rows={6}
                      placeholder="Présentez votre expertise, votre expérience et votre valeur ajoutée…"
                    />

                    <small>
                      Une bio courte et claire fonctionne mieux
                      pour une présentation professionnelle.
                    </small>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ------------------------------------------------------------
              OPTIONS
          ------------------------------------------------------------- */}

          {tab === "options" && (
            <section className="ss-section">
              <SectionIntro
                eyebrow="DECISION PATHS"
                title="Options & branches"
                description="Créez les parcours que votre visiteur pourra explorer."
              />

              <div className="ss-options-layout">

                <div className="ss-options-list">

                  <div className="ss-card ss-card-compact">
                    <div className="ss-card-header">
                      <div>
                        <h3>Parcours</h3>
                        <p>
                          {sortedOptions.length} option
                          {sortedOptions.length !== 1
                            ? "s"
                            : ""}
                        </p>
                      </div>

                      <span className="ss-count">
                        {sortedOptions.length}
                      </span>
                    </div>

                    <div className="ss-option-list">
                      {sortedOptions.map(
                        (option, index) => (
                          <button
                            key={option.id}
                            type="button"
                            className={
                              selectedOptionId === option.id
                                ? "ss-option-card ss-option-selected"
                                : "ss-option-card"
                            }
                            onClick={() =>
                              setSelectedOptionId(
                                option.id,
                              )
                            }
                          >
                            <span className="ss-option-number">
                              {String(index + 1).padStart(
                                2,
                                "0",
                              )}
                            </span>

                            <span className="ss-option-main">
                              <strong>
                                {option.label}
                              </strong>

                              <small>
                                {option.branch
                                  ? "✓ Branche configurée"
                                  : "⚠ Branche manquante"}
                              </small>
                            </span>

                            <span className="ss-option-arrow">
                              →
                            </span>
                          </button>
                        ),
                      )}

                      {sortedOptions.length === 0 && (
                        <div className="ss-empty-state">
                          <strong>
                            Aucune option
                          </strong>
                          <span>
                            Créez votre premier parcours
                            ci-dessous.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ss-card">
                    <div className="ss-card-header">
                      <div>
                        <h3>Nouvelle option</h3>
                        <p>
                          Une option représente une intention
                          du visiteur.
                        </p>
                      </div>
                    </div>

                    <div className="ss-field">
                      <label htmlFor="ss-new-option">
                        Label
                        <span>*</span>
                      </label>

                      <input
                        id="ss-new-option"
                        value={newOptionLabel}
                        onChange={(event) =>
                          setNewOptionLabel(
                            event.target.value,
                          )
                        }
                        placeholder="Ex. Web Development"
                      />
                    </div>

                    <div className="ss-subheading">
                      Branche initiale
                    </div>

                    <div className="ss-field">
                      <label>
                        Headline
                      </label>

                      <input
                        value={newBranch.headline}
                        onChange={(event) =>
                          setNewBranch((current) => ({
                            ...current,
                            headline:
                              event.target.value,
                          }))
                        }
                        placeholder="Créons votre présence digitale"
                      />
                    </div>

                    <div className="ss-field">
                      <label>
                        Description
                      </label>

                      <textarea
                        value={newBranch.description}
                        onChange={(event) =>
                          setNewBranch((current) => ({
                            ...current,
                            description:
                              event.target.value,
                          }))
                        }
                        rows={4}
                        placeholder="Expliquez ce que vous proposez pour ce parcours…"
                      />
                    </div>

                    <div className="ss-form-grid">
                      <div className="ss-field">
                        <label>CTA</label>

                        <input
                          value={newBranch.cta}
                          onChange={(event) =>
                            setNewBranch((current) => ({
                              ...current,
                              cta: event.target.value,
                            }))
                          }
                          placeholder="Discuter du projet"
                        />
                      </div>

                      <div className="ss-field">
                        <label>Proof</label>

                        <input
                          value={newBranch.proof}
                          onChange={(event) =>
                            setNewBranch((current) => ({
                              ...current,
                              proof: event.target.value,
                            }))
                          }
                          placeholder="Ex. 12 projets réalisés"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ss-button ss-button-primary ss-button-wide"
                      onClick={() => void addOption()}
                      disabled={
                        saving || !newOptionLabel.trim()
                      }
                    >
                      + Ajouter l'option
                    </button>
                  </div>
                </div>

                {/* Branch editor */}

                <div className="ss-card ss-branch-editor">
                  <div className="ss-card-header">
                    <div>
                      <span className="ss-eyebrow">
                        BRANCH
                      </span>

                      <h3>
                        {selectedOption
                          ? selectedOption.label
                          : "Sélectionnez une option"}
                      </h3>

                      <p>
                        Le contenu affiché après le choix du
                        visiteur.
                      </p>
                    </div>
                  </div>

                  {!selectedOption ? (
                    <div className="ss-empty-state ss-empty-large">
                      <strong>
                        Sélectionnez un parcours
                      </strong>

                      <span>
                        Cliquez sur une option à gauche pour
                        modifier sa branche.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="ss-field">
                        <label>
                          Headline de branche
                        </label>

                        <input
                          value={branchDraft.headline}
                          onChange={(event) =>
                            setBranchDraft(
                              (current) => ({
                                ...current,
                                headline:
                                  event.target.value,
                              }),
                            )
                          }
                          placeholder="Titre de votre réponse"
                        />
                      </div>

                      <div className="ss-field">
                        <label>
                          Description
                        </label>

                        <textarea
                          value={branchDraft.description}
                          onChange={(event) =>
                            setBranchDraft(
                              (current) => ({
                                ...current,
                                description:
                                  event.target.value,
                              }),
                            )
                          }
                          rows={7}
                          placeholder="Présentez votre solution, votre expertise ou votre proposition…"
                        />
                      </div>

                      <div className="ss-form-grid">
                        <div className="ss-field">
                          <label>CTA</label>

                          <input
                            value={branchDraft.cta}
                            onChange={(event) =>
                              setBranchDraft(
                                (current) => ({
                                  ...current,
                                  cta: event.target.value,
                                }),
                              )
                            }
                            placeholder="Contactez-moi"
                          />
                        </div>

                        <div className="ss-field">
                          <label>Proof</label>

                          <input
                            value={branchDraft.proof}
                            onChange={(event) =>
                              setBranchDraft(
                                (current) => ({
                                  ...current,
                                  proof: event.target.value,
                                }),
                              )
                            }
                            placeholder="Votre élément de preuve"
                          />
                        </div>
                      </div>

                      <div className="ss-branch-preview">
                        <span>
                          APERÇU DE LA BRANCHE
                        </span>

                        <strong>
                          {branchDraft.headline ||
                            "Headline de branche"}
                        </strong>

                        <p>
                          {branchDraft.description ||
                            "Description de la branche…"}
                        </p>

                        <button
                          type="button"
                          disabled
                        >
                          {branchDraft.cta ||
                            "CTA"}
                        </button>
                      </div>

                      <p className="ss-save-hint">
                        Les modifications de la branche sont
                        enregistrées avec <strong>Save</strong>.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ------------------------------------------------------------
              ARRANGE
          ------------------------------------------------------------- */}

          {tab === "arrange" && (
            <section className="ss-section">
              <SectionIntro
                eyebrow="ARRANGE"
                title="Ordre des parcours"
                description="L'ordre détermine la présentation des options dans votre capsule."
              />

              <div className="ss-card">
                <div className="ss-arrange-list">
                  {sortedOptions.map((option, index) => (
                    <div
                      key={option.id}
                      className="ss-arrange-item"
                    >
                      <span className="ss-drag-handle">
                        ⋮⋮
                      </span>

                      <span className="ss-arrange-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="ss-arrange-copy">
                        <strong>{option.label}</strong>
                        <small>
                          {option.branch
                            ? "Branche configurée"
                            : "Branche incomplète"}
                        </small>
                      </div>

                      <div className="ss-arrange-actions">
                        <button
                          type="button"
                          disabled={index === 0 || saving}
                          onClick={() =>
                            void moveOption(
                              option,
                              -1,
                            )
                          }
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                              sortedOptions.length -
                                1 || saving
                          }
                          onClick={() =>
                            void moveOption(
                              option,
                              1,
                            )
                          }
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ------------------------------------------------------------
              HOTSPOTS
          ------------------------------------------------------------- */}

          {tab === "hotspots" && (
            <section className="ss-section">
              <SectionIntro
                eyebrow="INTERACTION"
                title="Hotspots"
                description="Associez une zone visuelle à un parcours de votre capsule."
              />

              <div className="ss-card">
                <div className="ss-hotspot-info">
                  <div>
                    <strong>
                      {hotspots.length} hotspot
                      {hotspots.length !== 1
                        ? "s"
                        : ""}
                    </strong>

                    <p>
                      Sélectionnez une option puis cliquez
                      directement sur la cover dans le
                      preview.
                    </p>
                  </div>

                  <span className="ss-hotspot-badge">
                    LIVE
                  </span>
                </div>

                <div className="ss-hotspot-list">
                  {hotspots.map((hotspot) => {
                    const option = sortedOptions.find(
                      (item) =>
                        item.id === hotspot.optionId,
                    );

                    return (
                      <div
                        key={`${hotspot.optionId}-${hotspot.x}-${hotspot.y}`}
                        className="ss-hotspot-item"
                      >
                        <span className="ss-hotspot-dot" />

                        <div>
                          <strong>
                            {hotspot.label ||
                              option?.label ||
                              "Hotspot"}
                          </strong>

                          <small>
                            X {hotspot.x}% · Y{" "}
                            {hotspot.y}%
                          </small>
                        </div>
                      </div>
                    );
                  })}

                  {hotspots.length === 0 && (
                    <div className="ss-empty-state">
                      <strong>
                        Aucun hotspot
                      </strong>

                      <span>
                        Sélectionnez une option puis cliquez
                        sur la cover du preview.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ------------------------------------------------------------
              DESIGN
          ------------------------------------------------------------- */}

          {tab === "design" && (
            <section className="ss-section">
              <SectionIntro
                eyebrow="DESIGN"
                title="Cover & médias"
                description="Choisissez l'image qui représente votre expérience."
              />

              <div className="ss-card">
                <div className="ss-cover-editor">
                  <div
                    className="ss-cover-large"
                    style={{
                      background:
                        cover ||
                        GRADIENTS[gradientIndex],
                    }}
                  >
                    {cover && (
                      <img
                        src={cover}
                        alt=""
                      />
                    )}

                    <div className="ss-cover-overlay">
                      <div className="ss-large-avatar">
                        {capsule.identity.avatar ? (
                          <img
                            src={
                              capsule.identity.avatar
                            }
                            alt=""
                          />
                        ) : (
                          initials(displayName)
                        )}
                      </div>

                      <strong>
                        {displayName}
                      </strong>

                      <span>
                        {headline ||
                          "Votre headline"}
                      </span>
                    </div>
                  </div>

                  <div className="ss-cover-controls">
                    <div className="ss-subheading">
                      Image de couverture
                    </div>

                    <label className="ss-upload-button">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadAsset}
                      />
                      + Ajouter une image
                    </label>

                    <p>
                      L'image sera utilisée comme cover
                      publique de la capsule.
                    </p>

                    <div className="ss-subheading">
                      Dégradé de secours
                    </div>

                    <div className="ss-gradient-grid">
                      {GRADIENTS.map(
                        (gradient, index) => (
                          <button
                            key={gradient}
                            type="button"
                            className={
                              gradientIndex === index
                                ? "ss-gradient ss-gradient-selected"
                                : "ss-gradient"
                            }
                            style={{
                              background: gradient,
                            }}
                            onClick={() =>
                              setGradientIndex(
                                index,
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {assets.length > 0 && (
                  <div className="ss-assets">
                    <div className="ss-subheading">
                      Bibliothèque
                    </div>

                    <div className="ss-assets-grid">
                      {assets.map((url, index) => (
                        <button
                          key={`${url}-${index}`}
                          type="button"
                          className={
                            coverPreview === url
                              ? "ss-asset ss-asset-selected"
                              : "ss-asset"
                          }
                          onClick={() =>
                            setCoverPreview(url)
                          }
                        >
                          <img
                            src={url}
                            alt=""
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ------------------------------------------------------------
              SETTINGS
          ------------------------------------------------------------- */}

          {tab === "settings" && (
            <section className="ss-section">
              <SectionIntro
                eyebrow="PUBLICATION"
                title="Settings"
                description="Contrôlez la visibilité et les interactions publiques."
              />

              <div className="ss-card">
                <div className="ss-settings-list">

                  <div className="ss-setting">
                    <div>
                      <strong>
                        Publication
                      </strong>

                      <p>
                        Rendez la capsule accessible
                        publiquement.
                      </p>
                    </div>

                    <button
                      type="button"
                      className={
                        published
                          ? "ss-toggle ss-toggle-on"
                          : "ss-toggle"
                      }
                      onClick={() =>
                        setPublished(
                          (value) => !value,
                        )
                      }
                      aria-pressed={published}
                    >
                      <span />
                    </button>
                  </div>

                  <div className="ss-setting">
                    <div>
                      <strong>
                        Commentaires visiteurs
                      </strong>

                      <p>
                        Autoriser les visiteurs à
                        commenter votre capsule.
                      </p>
                    </div>

                    <button
                      type="button"
                      className={
                        commentsEnabled
                          ? "ss-toggle ss-toggle-on"
                          : "ss-toggle"
                      }
                      onClick={() =>
                        setCommentsEnabled(
                          (value) => !value,
                        )
                      }
                      aria-pressed={commentsEnabled}
                    >
                      <span />
                    </button>
                  </div>

                  <div className="ss-setting">
                    <div>
                      <strong>
                        Analytics
                      </strong>

                      <p>
                        Les événements de la capsule
                        sont préparés pour le dashboard
                        Analytics.
                      </p>
                    </div>

                    <span className="ss-coming">
                      ACTIF
                    </span>
                  </div>

                </div>
              </div>

              <div className="ss-card">
                <div className="ss-card-header">
                  <div>
                    <h3>URL publique</h3>
                    <p>
                      Adresse de votre capsule Faymoos.
                    </p>
                  </div>
                </div>

                <div className="ss-public-url">
                  <code>
                    /capsule/{capsule.identity.slug}
                  </code>

                  <a
                    href={`/capsule/${capsule.identity.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir →
                  </a>
                </div>
              </div>

              <div className="ss-card">
                <div className="ss-card-header">
                  <div>
                    <h3>Actions rapides</h3>
                  </div>
                </div>

                <div className="ss-quick-actions">
                  <Link
                    href={`/dashboard/space/preview/${capsule.id}`}
                    target="_blank"
                    className="ss-quick-action"
                  >
                    <span>◉</span>
                    <div>
                      <strong>
                        Preview
                      </strong>
                      <small>
                        Tester la capsule
                      </small>
                    </div>
                  </Link>

                  <Link
                    href={`/dashboard/capsule-comments?capsuleId=${encodeURIComponent(
                      capsule.id,
                    )}`}
                    className="ss-quick-action"
                  >
                    <span>◎</span>
                    <div>
                      <strong>
                        Commentaires
                      </strong>
                      <small>
                        Modération
                      </small>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/identities"
                    className="ss-quick-action"
                  >
                    <span>◉</span>
                    <div>
                      <strong>
                        Identity
                      </strong>
                      <small>
                        Gérer la présence
                      </small>
                    </div>
                  </Link>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* ============================================================
            LIVE CANVAS
        ============================================================= */}

        <aside className="ss-preview-panel">
          <div className="ss-preview-header">
            <div>
              <span className="ss-eyebrow">
                LIVE CANVAS
              </span>

              <strong>Preview</strong>
            </div>

            <span className="ss-live-dot">
              LIVE
            </span>
          </div>

          <div className="ss-preview-stage">
            <div className="ss-device">

              <div
                className="ss-device-cover"
                onClick={(event) => {
                  if (tab !== "hotspots") return;

                  const rect =
                    event.currentTarget.getBoundingClientRect();

                  const x =
                    ((event.clientX - rect.left) /
                      rect.width) *
                    100;

                  const y =
                    ((event.clientY - rect.top) /
                      rect.height) *
                    100;

                  addHotspot(x, y);
                }}
              >
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                  />
                ) : (
                  <div
                    style={{
                      background:
                        GRADIENTS[gradientIndex],
                    }}
                  />
                )}

                <div className="ss-device-cover-shade" />

                <div className="ss-device-identity">
                  <div className="ss-device-avatar">
                    {capsule.identity.avatar ? (
                      <img
                        src={
                          capsule.identity.avatar
                        }
                        alt=""
                      />
                    ) : (
                      initials(displayName)
                    )}
                  </div>

                  <strong>
                    {displayName ||
                      "Votre nom"}
                  </strong>

                  <span>
                    {headline ||
                      "Votre headline"}
                  </span>
                </div>

                {hotspots.map((hotspot) => (
                  <button
                    key={`${hotspot.optionId}-${hotspot.x}-${hotspot.y}`}
                    type="button"
                    className="ss-canvas-hotspot"
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedOptionId(
                        hotspot.optionId,
                      );
                    }}
                  >
                    ●
                  </button>
                ))}
              </div>

              <div className="ss-device-content">

                <span className="ss-device-label">
                  {title || "Faymoos Experience"}
                </span>

                <h3>
                  {objective ||
                    "Quelle piste souhaitez-vous explorer avec moi ?"}
                </h3>

                <div className="ss-device-options">
                  {sortedOptions.map(
                    (option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={
                          selectedOptionId ===
                          option.id
                            ? "ss-device-option ss-device-option-active"
                            : "ss-device-option"
                        }
                        onClick={() =>
                          setSelectedOptionId(
                            option.id,
                          )
                        }
                      >
                        <span>
                          {option.label}
                        </span>

                        <span>→</span>
                      </button>
                    ),
                  )}
                </div>

                {selectedOption && (
                  <div className="ss-device-branch">
                    <span>
                      {selectedOption.label}
                    </span>

                    <strong>
                      {branchDraft.headline ||
                        "Votre réponse"}
                    </strong>

                    <p>
                      {branchDraft.description ||
                        "Configurez cette branche dans le Studio."}
                    </p>

                    <button
                      type="button"
                      disabled
                    >
                      {branchDraft.cta ||
                        "Action"}
                    </button>

                    {branchDraft.proof && (
                      <small>
                        {branchDraft.proof}
                      </small>
                    )}
                  </div>
                )}

              </div>

              <div className="ss-device-footer">
                <span>
                  {sortedOptions.length} parcours
                </span>

                <span>
                  Powered by Faymoos
                </span>
              </div>
            </div>
          </div>

          <div className="ss-preview-footer">
            <div>
              <span>OPTIONS</span>
              <strong>
                {sortedOptions.length}
              </strong>
            </div>

            <div>
              <span>HOTSPOTS</span>
              <strong>
                {hotspots.length}
              </strong>
            </div>

            <div>
              <span>STATUS</span>
              <strong>
                {published
                  ? "Public"
                  : "Draft"}
              </strong>
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div
          className="ss-toast"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   SMALL UI COMPONENTS
====================================================================== */

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="ss-section-intro">
      <span className="ss-eyebrow">
        {eyebrow}
      </span>

      <h2>{title}</h2>

      <p>{description}</p>
    </div>
  );
}

function CheckItem({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  return (
    <div
      className={
        checked
          ? "ss-check ss-check-done"
          : "ss-check"
      }
    >
      <span>
        {checked ? "✓" : "○"}
      </span>

      <strong>{label}</strong>
    </div>
  );
}