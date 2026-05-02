"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type StudioInviteListRow = {
  id: string;
  inviteeEmail: string | null;
  expiresAt: string;
  createdAt: string;
  state: "pending" | "accepted" | "revoked" | "expired";
};

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "?";
  const parts = local.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return local.slice(0, 2).toUpperCase();
}

export default function StudioPage() {
  const router = useRouter();
  const [links, setLinks] = useState<StudioClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleOk, setRoleOk] = useState<boolean | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [linkConsent, setLinkConsent] = useState(false);
  const [invites, setInvites] = useState<StudioInviteListRow[]>([]);
  const [inviteEmailOpt, setInviteEmailOpt] = useState("");
  const [inviteDays, setInviteDays] = useState(7);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastInviteExpires, setLastInviteExpires] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const totals = useMemo(() => {
    const clients = links.length;
    const identities = links.reduce((acc, r) => acc + r.client._count.identityProfiles, 0);
    return { clients, identities };
  }, [links]);

  async function load() {
    setError("");
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
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(""), 4500);
    return () => window.clearTimeout(t);
  }, [success]);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    const res = await fetch("/api/studio/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), confirmConsent: linkConsent }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Erreur");
      setBusy(false);
      return;
    }
    setEmail("");
    setLinkConsent(false);
    setSuccess("Compte client lié. Vous pouvez gérer ses identités depuis Identités.");
    await load();
    setBusy(false);
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setCopied(false);
    setLastInviteUrl(null);
    setLastInviteExpires(null);
    setInviteBusy(true);
    const body: { inviteeEmail?: string; validityDays: number } = { validityDays: inviteDays };
    const em = inviteEmailOpt.trim();
    if (em) body.inviteeEmail = em;
    const res = await fetch("/api/studio/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setInviteError(typeof json.error === "string" ? json.error : "Erreur");
      setInviteBusy(false);
      return;
    }
    if (typeof json.inviteUrl === "string") {
      setLastInviteUrl(json.inviteUrl);
      setLastInviteExpires(typeof json.expiresAt === "string" ? json.expiresAt : null);
    }
    setInviteEmailOpt("");
    await load();
    setInviteBusy(false);
  }

  async function handleRevokeInvite(id: string) {
    if (!window.confirm("Révoquer cette invitation ? Les liens déjà copiés cesseront de fonctionner.")) return;
    setInviteBusy(true);
    setInviteError("");
    const res = await fetch(`/api/studio/invites?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setInviteError(typeof json.error === "string" ? json.error : "Erreur");
    } else {
      await load();
    }
    setInviteBusy(false);
  }

  async function copyLastLink() {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setInviteError("Copie impossible — sélectionnez le lien manuellement.");
    }
  }

  async function handleUnlink(clientUserId: string, clientEmail: string) {
    const ok = window.confirm(
      `Retirer le lien avec ${clientEmail} ? Le client conserve son compte ; vous n’aurez plus accès à la gestion de ses identités.`,
    );
    if (!ok) return;

    setBusy(true);
    setError("");
    const res = await fetch(`/api/studio/clients?clientUserId=${encodeURIComponent(clientUserId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(typeof json.error === "string" ? json.error : "Erreur");
    } else {
      await load();
      setSuccess("Lien retiré.");
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-bordeaux-200 border-t-bordeaux-600"
          aria-hidden
        />
        <p className="text-sm font-medium text-stone-500">Chargement de l’espace Studio…</p>
      </div>
    );
  }

  if (roleOk === false) {
    return (
      <div className="mx-auto max-w-xl animate-in">
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-8 shadow-lg shadow-stone-200/50 ring-1 ring-stone-100">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-bordeaux-100/60 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
              Accès restreint
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">Espace Studio</h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Cette zone est réservée aux comptes <strong className="text-stone-800">Studio</strong> (partenaires /
              agences). Un administrateur Faymoos peut activer ce mode depuis la gestion des utilisateurs.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-bordeaux-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-bordeaux-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-4 animate-in">
      {/* En-tête */}
      <header className="flex flex-col gap-6 border-b border-stone-200/80 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-bordeaux-200/80 bg-bordeaux-50 px-3 py-1 text-xs font-semibold text-bordeaux-900">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bordeaux-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-bordeaux-600" />
              </span>
              Mode Studio · B2B
            </span>
            {accountEmail && (
              <span className="text-xs text-stone-500">
                Connecté · <span className="font-medium text-stone-700">{accountEmail}</span>
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-[1.75rem] leading-tight">
              Vos comptes clients
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
              Liez des organisations ou clients finaux qui ont déjà un compte Faymoos, puis pilotez leurs identités,
              capsules et contenus depuis votre session — comme un véritable espace agence.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <Link
            href="/dashboard/identities"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-bordeaux-200 hover:bg-bordeaux-50/50"
          >
            <svg className="h-4 w-4 text-bordeaux-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
              />
            </svg>
            Identités
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm ring-1 ring-stone-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Clients liés</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-stone-900">{totals.clients}</p>
          <p className="mt-1 text-xs text-stone-500">Comptes rattachés à votre Studio</p>
        </div>
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm ring-1 ring-stone-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Identités gérées</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-bordeaux-800">{totals.identities}</p>
          <p className="mt-1 text-xs text-stone-500">Total côté clients (aperçu)</p>
        </div>
        <div className="rounded-2xl border border-bordeaux-100 bg-gradient-to-br from-bordeaux-50 to-white p-5 shadow-sm ring-1 ring-bordeaux-100/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-bordeaux-800/80">Étape suivante</p>
          <p className="mt-2 text-sm font-medium leading-snug text-bordeaux-950">
            Créez ou modifiez les profils dans <span className="font-semibold">Identités</span> — vos espaces et ceux
            des clients apparaissent ensemble lorsque le lien est actif.
          </p>
        </div>
      </section>

      {/* Invitation par lien (client accepte lui-même) */}
      <section className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-stone-50/80 p-6 shadow-sm ring-1 ring-emerald-100/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Invitation sécurisée (recommandé)</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-stone-600">
              Générez un lien unique. Le client peut{" "}
              <strong className="text-stone-800">accepter depuis son tableau de bord Faymoos</strong> dès que son e-mail
              est renseigné ci-dessous — ou ouvrir le lien (connexion / inscription puis accepter). Le jeton est stocké
              haché côté serveur ; copiez le lien tout de suite si vous souhaitez aussi le transmettre par message : il
              ne sera plus affiché en clair.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateInvite} className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="invite-email-opt" className="text-xs font-medium text-stone-600">
              E-mail du client (optionnel mais recommandé)
            </label>
            <input
              id="invite-email-opt"
              type="email"
              autoComplete="off"
              value={inviteEmailOpt}
              onChange={(e) => setInviteEmailOpt(e.target.value)}
              placeholder="contact@entreprise.com — lie l’invitation à ce compte uniquement"
              className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/60"
            />
            <p className="text-[11px] text-stone-500">
              Si renseigné : seul ce compte pourra accepter, et l’invitation apparaît sur son tableau de bord après
              connexion (plus besoin d’ouvrir le lien).
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="invite-days" className="text-xs font-medium text-stone-600">
              Validité
            </label>
            <select
              id="invite-days"
              value={inviteDays}
              onChange={(e) => setInviteDays(Number(e.target.value))}
              className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/60"
            >
              {[1, 3, 7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  {d} jour{d > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={inviteBusy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:opacity-50"
            >
              {inviteBusy ? "Génération…" : "Générer le lien d’invitation"}
            </button>
            {lastInviteUrl && (
              <button
                type="button"
                onClick={copyLastLink}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
              >
                {copied ? "Copié !" : "Copier le lien"}
              </button>
            )}
          </div>
        </form>

        {inviteError && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {inviteError}
          </p>
        )}

        {lastInviteUrl && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-white/90 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900">Lien à transmettre</p>
            <p className="mt-1 break-all font-mono text-xs text-stone-800">{lastInviteUrl}</p>
            {lastInviteExpires && (
              <p className="mt-2 text-[11px] text-stone-500">
                Expire le {new Date(lastInviteExpires).toLocaleString("fr-FR")}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-emerald-200/60 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-600">Invitations récentes</h3>
          {invites.length === 0 ? (
            <p className="mt-2 text-xs text-stone-500">Aucune invitation enregistrée.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
              {invites.map((inv) => (
                <li key={inv.id} className="flex flex-col gap-2 px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-stone-700">
                    <span className="font-medium capitalize text-stone-900">{inv.state}</span>
                    {inv.inviteeEmail && <span className="text-stone-500"> · {inv.inviteeEmail}</span>}
                    <span className="block text-[11px] text-stone-500">
                      expire {new Date(inv.expiresAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  {inv.state === "pending" && (
                    <button
                      type="button"
                      disabled={inviteBusy}
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="self-start rounded-lg border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      Révoquer
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Parcours B2B */}
      <section className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-6 ring-1 ring-stone-100">
        <h2 className="text-sm font-semibold text-stone-900">Comment ça marche</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Le client crée son compte",
              desc: "Il s’inscrit sur Faymoos avec l’email professionnel ou perso qu’il utilisera aussi pour se connecter.",
            },
            {
              step: "02",
              title: "Invitation ou liaison",
              desc: "Indiquez l’e-mail du client : il verra l’invitation sur son tableau de bord et pourra accepter dans l’app. Vous pouvez aussi lui envoyer le lien généré (WhatsApp, mail, etc.). Option avancée : liaison directe par e-mail avec confirmation.",
            },
            {
              step: "03",
              title: "Vous livrez",
              desc: "Ouverture d’Identités, capsules, médias : tout le flux produit se fait depuis votre dashboard, sans partage de mot de passe.",
            },
          ].map((item) => (
            <li
              key={item.step}
              className="relative rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm"
            >
              <span className="font-mono text-xs font-bold text-bordeaux-600">{item.step}</span>
              <p className="mt-2 text-sm font-semibold text-stone-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">{item.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Colonne invitation */}
        <section className="lg:col-span-5">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-md shadow-stone-200/40 ring-1 ring-stone-100">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bordeaux-100 text-bordeaux-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-900">Liaison directe par e-mail</h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Option avancée si le client ne peut pas utiliser le lien. Préférez l’invitation ci-dessus lorsque
                  possible.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-amber-950/90">
              <p className="font-semibold text-amber-950">Sécurité & bonnes pratiques</p>
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-amber-950/85">
                <li>Case à cocher obligatoire : accord / mandat du titulaire du compte.</li>
                <li>Quota horaire sur les liaisons (limitation des abus).</li>
                <li>Les comptes administrateur plateforme ne peuvent pas être rattachés comme clients.</li>
              </ul>
            </div>

            <form onSubmit={handleLink} className="mt-6 space-y-4">
              <div>
                <label htmlFor="studio-client-email" className="sr-only">
                  Email du client
                </label>
                <input
                  id="studio-client-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@entreprise.com"
                  className="block w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-bordeaux-400 focus:bg-white focus:ring-2 focus:ring-bordeaux-200/60"
                />
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/40 px-3 py-3 text-left transition hover:bg-stone-50/80">
                <input
                  type="checkbox"
                  checked={linkConsent}
                  onChange={(e) => setLinkConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-bordeaux-700 focus:ring-bordeaux-500"
                />
                <span className="text-xs leading-relaxed text-stone-700">
                  Je confirme disposer d’un <strong className="font-semibold text-stone-900">mandat</strong>, d’un
                  contrat ou d’un <strong className="font-semibold text-stone-900">accord explicite</strong> du client
                  pour agir sur son espace Faymoos (responsabilité de l’organisme studio).
                </span>
              </label>
              <button
                type="submit"
                disabled={busy || !email.trim() || !linkConsent}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-bordeaux-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-bordeaux-900 disabled:pointer-events-none disabled:opacity-45"
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Liaison…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Lier le compte
                  </>
                )}
              </button>
            </form>

            {error && (
              <div
                className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
                role="alert"
              >
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </div>
            )}
          </div>
        </section>

        {/* Annuaire clients */}
        <section className="lg:col-span-7">
          <div className="rounded-2xl border border-stone-200/90 bg-white shadow-md shadow-stone-200/40 ring-1 ring-stone-100">
            <div className="flex flex-col gap-1 border-b border-stone-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-900">Annuaire</h2>
                <p className="text-xs text-stone-500">
                  {totals.clients === 0
                    ? "Aucun client pour l’instant — ajoutez un premier compte à gauche."
                    : `${totals.clients} compte${totals.clients > 1 ? "s" : ""} sous mandat`}
                </p>
              </div>
              <Link
                href="/dashboard/identities"
                className="text-xs font-semibold text-bordeaux-700 hover:text-bordeaux-900"
              >
                Ouvrir Identités →
              </Link>
            </div>

            {links.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-stone-800">Aucun client lié</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-stone-500">
                  Les comptes apparaîtront ici avec l’email, la date de rattachement et le nombre d’identités
                  visibles dans votre espace.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {links.map((row) => {
                  const idents = row.client._count.identityProfiles;
                  const linked = new Date(row.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <li key={row.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-bordeaux-100 to-stone-100 text-sm font-bold text-bordeaux-900 ring-1 ring-bordeaux-200/40"
                          aria-hidden
                        >
                          {initialsFromEmail(row.client.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-stone-900">{row.client.email}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-emerald-500" />
                              Mandat actif
                            </span>
                            <span>Lié le {linked}</span>
                            <span>
                              {idents} identité{idents > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <Link
                          href="/dashboard/identities"
                          className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:border-bordeaux-200 hover:bg-bordeaux-50/60"
                        >
                          Gérer le contenu
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleUnlink(row.clientUserId, row.client.email)}
                          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-stone-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          Retirer le lien
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-stone-400">
            La suppression du lien ne supprime pas le compte client ni ses données ; elle retire uniquement votre accès
            de gestionnaire Studio.
          </p>
        </section>
      </div>
    </div>
  );
}
