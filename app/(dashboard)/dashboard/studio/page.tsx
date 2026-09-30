"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JoinRequestsPanel } from "@/components/studio/JoinRequestsPanel";
import { PartnerQrPanel } from "@/components/studio/PartnerQrPanel";

type StudioClientRow = {
  id: string;
  affiliateUserId: string;
  clientUserId: string;
  createdAt: string;
  client: {
    id: string;
    email: string;
    createdAt: string;
    _count: { identityProfiles: number };
  };
};

type InviteState = "pending" | "accepted" | "revoked" | "expired";

type StudioInviteListRow = {
  id: string;
  inviteeEmail: string | null;
  expiresAt: string;
  createdAt: string;
  state: InviteState;
};

type StudioMetrics = {
  activeClients: number;
  pendingInvites: number;
  invitesCreatedLast30Days: number;
  invitesAcceptedLast30Days: number;
  acceptanceRateLast30Days: number | null;
  windowDays: number;
};

type Notice = { kind: "success" | "error"; text: string } | null;

type AddMode = "email" | "link" | "qr";

const ADD_MODES: ReadonlyArray<readonly [AddMode, string]> = [
  ["email", "Par e-mail"],
  ["link", "Lien unique"],
  ["qr", "QR code"],
];

const INVITE_STATE: Record<InviteState, { label: string; className: string }> = {
  pending: { label: "En attente", className: "border-[#C6A15B]/40 bg-[#C6A15B]/10 text-[#E2C68E]" },
  accepted: { label: "Acceptée", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  revoked: { label: "Révoquée", className: "border-white/10 bg-white/[.04] text-white/45" },
  expired: { label: "Expirée", className: "border-white/10 bg-white/[.04] text-white/45" },
};

const INVITE_ORDER: Record<InviteState, number> = { pending: 0, accepted: 1, expired: 2, revoked: 3 };

const CARD = "rounded-3xl border border-white/10 bg-white/[.035]";
const INPUT =
  "block w-full rounded-xl border border-white/10 bg-[#0B0D10] px-4 py-3 text-sm text-[#F7F4EE] placeholder:text-white/30 outline-none transition focus:border-[#C6A15B]/60 focus:ring-2 focus:ring-[#C6A15B]/20";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#C6A15B] px-5 py-3 text-sm font-semibold text-[#0B0D10] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-[#C6A15B]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-45";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "?";
  const parts = local.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return local.slice(0, 2).toUpperCase();
}

function formatDate(iso: string, withTime = false) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 ${
        light ? "border-[#0B0D10]/25 border-t-[#0B0D10]" : "border-white/20 border-t-[#C6A15B]"
      }`}
      aria-hidden
    />
  );
}

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const ok = notice.kind === "success";
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`flex gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${
        ok ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"
      }`}
    >
      <span aria-hidden className="font-semibold">
        {ok ? "✓" : "!"}
      </span>
      <span>{notice.text}</span>
    </div>
  );
}

function StatTile({ label, value, hint, accent = false }: { label: string; value: string | number; hint: string; accent?: boolean }) {
  return (
    <div className={`${CARD} p-5`}>
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/40">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${accent ? "text-[#C6A15B]" : "text-[#F7F4EE]"}`}>{value}</p>
      <p className="mt-1 text-xs text-white/40">{hint}</p>
    </div>
  );
}

export default function StudioPage() {
  const router = useRouter();
  const [links, setLinks] = useState<StudioClientRow[]>([]);
  const [invites, setInvites] = useState<StudioInviteListRow[]>([]);
  const [metrics, setMetrics] = useState<StudioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleOk, setRoleOk] = useState<boolean | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  const [mode, setMode] = useState<AddMode>("email");
  const [studioReloadKey, setStudioReloadKey] = useState(0);
  const [inviteQr, setInviteQr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [linkConsent, setLinkConsent] = useState(false);
  const [inviteEmailOpt, setInviteEmailOpt] = useState("");
  const [inviteDays, setInviteDays] = useState(7);
  const [formBusy, setFormBusy] = useState(false);
  const [formNotice, setFormNotice] = useState<Notice>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastInviteExpires, setLastInviteExpires] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [search, setSearch] = useState("");
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [clientsNotice, setClientsNotice] = useState<Notice>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [invitesNotice, setInvitesNotice] = useState<Notice>(null);
  const [exportKind, setExportKind] = useState<null | "csv" | "pdf">(null);
  const [exportNote, setExportNote] = useState("");

  const totals = useMemo(() => {
    const clients = links.length;
    const identities = links.reduce((acc, r) => acc + r.client._count.identityProfiles, 0);
    const pending = invites.filter((i) => i.state === "pending").length;
    return { clients, identities, pending };
  }, [links, invites]);

  const filteredLinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? links.filter((l) => l.client.email.toLowerCase().includes(q)) : links;
  }, [links, search]);

  const sortedInvites = useMemo(
    () =>
      [...invites].sort(
        (a, b) =>
          INVITE_ORDER[a.state] - INVITE_ORDER[b.state] ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [invites],
  );

  async function load() {
    const res = await fetch("/api/studio/clients");
    if (res.status === 403) {
      setRoleOk(false);
      setLinks([]);
      setInvites([]);
      setLoading(false);
      return;
    }
    if (res.status === 401) {
      setLoading(false);
      router.push("/login");
      return;
    }
    setRoleOk(true);
    const data = await res.json();
    setLinks(Array.isArray(data) ? data : []);
    const ir = await fetch("/api/studio/invites");
    if (ir.ok) {
      const invData = await ir.json();
      setInvites(Array.isArray(invData) ? invData : []);
    } else {
      setInvites([]);
    }
    const mr = await fetch("/api/studio/metrics");
    if (mr.ok) {
      const m = await mr.json();
      setMetrics(m && typeof m.activeClients === "number" ? (m as StudioMetrics) : null);
    } else {
      setMetrics(null);
    }
    setLoading(false);

    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.email) setAccountEmail(d.email as string);
      })
      .catch(() => {});
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lastInviteUrl) {
      setInviteQr(null);
      return;
    }
    QRCode.toDataURL(lastInviteUrl, { width: 240, margin: 2, color: { dark: "#0B0D10", light: "#FFFFFF" } })
      .then(setInviteQr)
      .catch(() => setInviteQr(null));
  }, [lastInviteUrl]);

  function switchMode(next: AddMode) {
    setMode(next);
    setFormNotice(null);
  }

  async function handleAccessRequest(e: React.FormEvent) {
    e.preventDefault();
    setFormNotice(null);
    setFormBusy(true);
    const res = await fetch("/api/studio/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), confirmConsent: linkConsent }),
    });
    const json = await res.json().catch(() => ({}));
    setFormBusy(false);
    if (!res.ok) {
      setFormNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Erreur" });
      return;
    }
    setEmail("");
    setLinkConsent(false);
    setFormNotice({
      kind: "success",
      text:
        typeof json.message === "string"
          ? json.message
          : "Demande d’accès envoyée. Le client doit l’accepter depuis son tableau de bord.",
    });
    await load();
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormNotice(null);
    setCopied(false);
    setLastInviteUrl(null);
    setLastInviteExpires(null);
    setFormBusy(true);
    const body: { inviteeEmail?: string; validityDays: number } = { validityDays: inviteDays };
    const em = inviteEmailOpt.trim();
    if (em) body.inviteeEmail = em;
    const res = await fetch("/api/studio/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setFormBusy(false);
    if (!res.ok) {
      setFormNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Erreur" });
      return;
    }
    if (typeof json.inviteUrl === "string") {
      setLastInviteUrl(json.inviteUrl);
      setLastInviteExpires(typeof json.expiresAt === "string" ? json.expiresAt : null);
    }
    setInviteEmailOpt("");
    await load();
  }

  async function copyLastLink() {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFormNotice({ kind: "error", text: "Copie impossible — sélectionnez le lien manuellement." });
    }
  }

  async function handleRevokeInvite(id: string) {
    if (!window.confirm("Révoquer cette invitation ? Les liens déjà copiés cesseront de fonctionner.")) return;
    setRevokingId(id);
    setInvitesNotice(null);
    const res = await fetch(`/api/studio/invites?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setInvitesNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Erreur" });
    } else {
      await load();
    }
    setRevokingId(null);
  }

  async function handleUnlink(clientUserId: string, clientEmail: string) {
    const ok = window.confirm(
      `Retirer le lien avec ${clientEmail} ? Le client conserve son compte ; vous n’aurez plus accès à la gestion de ses identités.`,
    );
    if (!ok) return;

    setUnlinkingId(clientUserId);
    setClientsNotice(null);
    const res = await fetch(`/api/studio/clients?clientUserId=${encodeURIComponent(clientUserId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setClientsNotice({ kind: "error", text: typeof json.error === "string" ? json.error : "Erreur" });
    } else {
      await load();
      setClientsNotice({ kind: "success", text: `Lien avec ${clientEmail} retiré.` });
    }
    setUnlinkingId(null);
  }

  async function handleExport(kind: "csv" | "pdf") {
    setExportNote("");
    setExportKind(kind);
    try {
      const url = kind === "pdf" ? "/api/studio/clients/export?format=pdf" : "/api/studio/clients/export";
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 429) {
        setExportNote("Trop de téléchargements. Réessayez dans une heure.");
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setExportNote(typeof json.error === "string" ? json.error : "Export impossible pour le moment.");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="([^"]+)"/);
      const fallback =
        kind === "pdf"
          ? `faymoos-studio-rapport-${new Date().toISOString().slice(0, 10)}.pdf`
          : `faymoos-studio-clients-${new Date().toISOString().slice(0, 10)}.csv`;
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = match?.[1] ?? fallback;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      setExportNote("Export impossible (réseau ou navigateur).");
    } finally {
      setExportKind(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6" aria-busy="true" aria-label="Chargement de l’espace commercial">
        <div className="h-24 animate-pulse rounded-3xl bg-white/[.035]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/[.035]" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-80 animate-pulse rounded-3xl bg-white/[.035] lg:col-span-7" />
          <div className="h-80 animate-pulse rounded-3xl bg-white/[.035] lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (roleOk === false) {
    return (
      <div className="mx-auto max-w-xl animate-in">
        <div className={`${CARD} p-8`}>
          <p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Accès restreint</p>
          <h1 className="mt-3 text-2xl font-semibold">Client Studio</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            Cette zone est réservée aux comptes <strong className="text-[#F7F4EE]">partenaires / agences</strong> avec un
            abonnement Studio. Un administrateur Faymoos peut activer ce rôle ; l’abonnement se gère dans Facturation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className={BTN_SECONDARY}>
              ← Tableau de bord
            </Link>
            <Link href="/dashboard/billing" className={BTN_PRIMARY}>
              Voir les offres
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const acceptance =
    metrics == null ? "—" : metrics.acceptanceRateLast30Days == null ? "N/A" : `${metrics.acceptanceRateLast30Days}%`;
  const acceptanceHint =
    metrics == null
      ? "Indisponible"
      : metrics.invitesCreatedLast30Days === 0
        ? `Aucune invitation sur ${metrics.windowDays} j`
        : `${metrics.invitesAcceptedLast30Days} / ${metrics.invitesCreatedLast30Days} sur ${metrics.windowDays} j`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-6 animate-in">
      {/* ── En-tête ── */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Client Studio</p>
          <h1 className="mt-2 text-3xl font-semibold">Vos clients, gérés en un seul endroit.</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            Invitez un client, attendez son accord, puis gérez ses identités et capsules depuis votre session — sans
            partage de mot de passe.
          </p>
          {accountEmail && <p className="mt-2 text-xs text-white/35">Connecté · {accountEmail}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" disabled={exportKind !== null} onClick={() => handleExport("pdf")} className={BTN_SECONDARY}>
            {exportKind === "pdf" ? <Spinner /> : <span aria-hidden>↓</span>}
            Rapport PDF
          </button>
          <button type="button" disabled={exportKind !== null} onClick={() => handleExport("csv")} className={BTN_SECONDARY}>
            {exportKind === "csv" ? <Spinner /> : <span aria-hidden>↓</span>}
            CSV
          </button>
        </div>
      </header>
      {exportNote && <NoticeBox notice={{ kind: "error", text: exportNote }} />}

      {/* ── Indicateurs ── */}
      <section aria-label="Indicateurs" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Clients actifs" value={metrics?.activeClients ?? totals.clients} hint="Comptes ayant accepté votre accès" />
        <StatTile label="Identités gérées" value={totals.identities} hint="Profils de vos clients" />
        <StatTile
          label="En attente"
          value={metrics?.pendingInvites ?? totals.pending}
          hint="Invitations non encore acceptées"
          accent
        />
        <StatTile label="Acceptation" value={acceptance} hint={acceptanceHint} accent />
      </section>

      <JoinRequestsPanel
        reloadKey={studioReloadKey}
        onDecided={() => {
          setStudioReloadKey((k) => k + 1);
          load();
        }}
      />

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* ── Clients ── */}
        <section aria-labelledby="studio-clients-title" className={`${CARD} lg:col-span-7`}>
          <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="studio-clients-title" className="font-semibold">
                Clients <span className="ml-1 text-sm font-normal text-white/40">{totals.clients}</span>
              </h2>
              <p className="mt-0.5 text-xs text-white/40">Comptes que vous pouvez gérer.</p>
            </div>
            {links.length > 3 && (
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un e-mail…"
                aria-label="Rechercher un client"
                className={`${INPUT} py-2 sm:w-60`}
              />
            )}
          </div>

          {clientsNotice && (
            <div className="px-5 pt-4">
              <NoticeBox notice={clientsNotice} />
            </div>
          )}

          {links.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#C6A15B]/30 bg-[#C6A15B]/10 text-xl text-[#C6A15B]">
                ✦
              </div>
              <p className="mt-4 font-medium">Aucun client pour l’instant</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-white/45">
                Envoyez une demande d’accès depuis le panneau « Ajouter un client ». Le compte apparaîtra ici dès que
                le client l’aura acceptée.
              </p>
            </div>
          ) : filteredLinks.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-white/45">Aucun client ne correspond à « {search} ».</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {filteredLinks.map((row) => {
                const idents = row.client._count.identityProfiles;
                const unlinking = unlinkingId === row.clientUserId;
                return (
                  <li key={row.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#C6A15B]/25 bg-[#C6A15B]/10 text-sm font-semibold text-[#E2C68E]"
                        aria-hidden
                      >
                        {initialsFromEmail(row.client.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.client.email}</p>
                        <p className="mt-1 text-xs text-white/40">
                          {idents} identité{idents > 1 ? "s" : ""} · lié le {formatDate(row.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link href="/dashboard/identities" className={`${BTN_SECONDARY} px-3 py-2 text-xs`}>
                        Gérer
                      </Link>
                      <button
                        type="button"
                        disabled={unlinkingId !== null}
                        onClick={() => handleUnlink(row.clientUserId, row.client.email)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white/45 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-45"
                      >
                        {unlinking && <Spinner />}
                        Retirer
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="border-t border-white/10 px-5 py-3 text-[11px] text-white/35">
            Retirer un lien ne supprime ni le compte ni les données du client : seul votre accès de gestion est retiré.
            Le client peut aussi retirer votre accès à tout moment.
          </p>
        </section>

        <div className="space-y-6 lg:col-span-5">
          {/* ── Ajouter un client ── */}
          <section aria-labelledby="studio-add-title" className={`${CARD} p-5`}>
            <h2 id="studio-add-title" className="font-semibold">
              Ajouter un client
            </h2>
            <p className="mt-0.5 text-xs text-white/40">Le client doit toujours accepter avant que vous puissiez agir.</p>

            <div role="tablist" aria-label="Méthode d’invitation" className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-[#0B0D10] p-1">
              {ADD_MODES.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={mode === key}
                  onClick={() => switchMode(key)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    mode === key ? "bg-[#C6A15B] text-[#0B0D10]" : "text-white/55 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "qr" ? (
              <PartnerQrPanel key={studioReloadKey} />
            ) : mode === "email" ? (
              <form onSubmit={handleAccessRequest} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="studio-client-email" className="text-xs font-medium text-white/60">
                    E-mail du compte Faymoos du client
                  </label>
                  <input
                    id="studio-client-email"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                    className={INPUT}
                  />
                  <p className="text-[11px] text-white/35">
                    La demande apparaît sur son tableau de bord ; elle expire après 7 jours.
                  </p>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#0B0D10] p-3 transition hover:border-white/20">
                  <input
                    type="checkbox"
                    checked={linkConsent}
                    onChange={(e) => setLinkConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#C6A15B]"
                  />
                  <span className="text-xs leading-relaxed text-white/60">
                    Je dispose d’un <strong className="text-[#F7F4EE]">mandat</strong> ou d’un{" "}
                    <strong className="text-[#F7F4EE]">accord</strong> du client pour gérer son espace Faymoos.
                  </span>
                </label>
                <button type="submit" disabled={formBusy || !email.trim() || !linkConsent} className={`${BTN_PRIMARY} w-full`}>
                  {formBusy && <Spinner light />}
                  {formBusy ? "Envoi…" : "Envoyer la demande d’accès"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateInvite} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <div className="space-y-1.5">
                    <label htmlFor="invite-email-opt" className="text-xs font-medium text-white/60">
                      Réserver à un e-mail <span className="text-white/35">(optionnel)</span>
                    </label>
                    <input
                      id="invite-email-opt"
                      type="email"
                      autoComplete="off"
                      value={inviteEmailOpt}
                      onChange={(e) => setInviteEmailOpt(e.target.value)}
                      placeholder="contact@entreprise.com"
                      className={INPUT}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="invite-days" className="text-xs font-medium text-white/60">
                      Validité
                    </label>
                    <select
                      id="invite-days"
                      value={inviteDays}
                      onChange={(e) => setInviteDays(Number(e.target.value))}
                      className={INPUT}
                    >
                      {[1, 3, 7, 14, 30].map((d) => (
                        <option key={d} value={d}>
                          {d} jour{d > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-white/35">
                  Sans e-mail, toute personne ayant le lien peut l’accepter après connexion. Le lien n’est affiché
                  qu’une seule fois.
                </p>
                <button type="submit" disabled={formBusy} className={`${BTN_PRIMARY} w-full`}>
                  {formBusy && <Spinner light />}
                  {formBusy ? "Génération…" : "Générer le lien"}
                </button>

                {lastInviteUrl && (
                  <div className="rounded-xl border border-[#C6A15B]/30 bg-[#C6A15B]/[.06] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#C6A15B]">Lien à transmettre</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        readOnly
                        value={lastInviteUrl}
                        onFocus={(e) => e.currentTarget.select()}
                        aria-label="Lien d’invitation"
                        className={`${INPUT} py-2 font-mono text-xs`}
                      />
                      <button type="button" onClick={copyLastLink} className={`${BTN_SECONDARY} shrink-0 px-3 py-2 text-xs`}>
                        {copied ? "Copié ✓" : "Copier"}
                      </button>
                    </div>
                    {lastInviteExpires && (
                      <p className="mt-2 text-[11px] text-white/40">Expire le {formatDate(lastInviteExpires, true)}</p>
                    )}
                    {inviteQr && (
                      <div className="mt-3 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={inviteQr} alt="QR code du lien d’invitation" className="h-24 w-24 rounded-lg bg-white p-1" />
                        <p className="text-[11px] leading-relaxed text-white/45">
                          À scanner sur place par le client. Usage unique, comme le lien.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}

            {formNotice && (
              <div className="mt-4">
                <NoticeBox notice={formNotice} />
              </div>
            )}
          </section>

          {/* ── Invitations ── */}
          <section aria-labelledby="studio-invites-title" className={CARD}>
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 id="studio-invites-title" className="font-semibold">
                  Invitations
                </h2>
                <p className="mt-0.5 text-xs text-white/40">Demandes envoyées et liens générés.</p>
              </div>
              {totals.pending > 0 && (
                <span className="rounded-full border border-[#C6A15B]/40 bg-[#C6A15B]/10 px-2.5 py-1 text-[11px] font-semibold text-[#E2C68E]">
                  {totals.pending} en attente
                </span>
              )}
            </div>

            {invitesNotice && (
              <div className="px-5 pt-4">
                <NoticeBox notice={invitesNotice} />
              </div>
            )}

            {sortedInvites.length === 0 ? (
              <p className="p-5 text-sm text-white/40">Aucune invitation pour l’instant.</p>
            ) : (
              <ul className="max-h-[360px] divide-y divide-white/10 overflow-y-auto">
                {sortedInvites.map((inv) => {
                  const state = INVITE_STATE[inv.state];
                  return (
                    <li key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {inv.inviteeEmail ?? <span className="text-white/50">Lien ouvert (tout compte)</span>}
                        </p>
                        <p className="mt-0.5 text-[11px] text-white/35">
                          {inv.state === "pending"
                            ? `Expire le ${formatDate(inv.expiresAt, true)}`
                            : `Créée le ${formatDate(inv.createdAt)}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${state.className}`}>
                          {state.label}
                        </span>
                        {inv.state === "pending" && (
                          <button
                            type="button"
                            disabled={revokingId !== null}
                            onClick={() => handleRevokeInvite(inv.id)}
                            aria-label={`Révoquer l’invitation ${inv.inviteeEmail ?? ""}`}
                            className="rounded-lg px-2 py-1 text-[11px] font-medium text-white/40 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-45"
                          >
                            {revokingId === inv.id ? "…" : "Révoquer"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* ── Aide ── */}
      <details className={`${CARD} group p-5`}>
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
          Comment ça marche ?
          <span className="text-[#C6A15B] transition group-open:rotate-45" aria-hidden>
            +
          </span>
        </summary>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Le client a un compte", "Il s’inscrit sur Faymoos avec l’e-mail qu’il utilise pour se connecter."],
            [
              "02",
              "Il accepte votre accès",
              "Par e-mail, la demande apparaît sur son tableau de bord. Par lien, il l’ouvre puis accepte. Par QR code, il demande à vous rejoindre et vous validez.",
            ],
            [
              "03",
              "Vous gérez son espace",
              "Identités, capsules et médias depuis votre dashboard. Il peut retirer votre accès à tout moment.",
            ],
          ].map(([step, title, desc]) => (
            <li key={step} className="rounded-2xl border border-white/10 bg-[#0B0D10] p-4">
              <span className="font-mono text-xs font-semibold text-[#C6A15B]">{step}</span>
              <p className="mt-2 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">{desc}</p>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
