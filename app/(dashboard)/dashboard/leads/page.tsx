"use client";

import { useCallback, useEffect, useState } from "react";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  status: LeadStatus;
  branchLabel: string | null;
  createdAt: string;
  identity: { id: string; name: string; slug: string };
  capsule: { id: string; title: string } | null;
};

type Counts = Record<LeadStatus, number>;
type Page = { leads: Lead[]; counts: Counts | null; nextCursor: string | null; error: string | null };

const STATUSES: { key: LeadStatus; label: string; dot: string; chip: string }[] = [
  { key: "NEW", label: "Nouveau", dot: "bg-[#C6A15B]", chip: "border-[#C6A15B]/40 bg-[#C6A15B]/10 text-[#E2C68E]" },
  { key: "CONTACTED", label: "Contacté", dot: "bg-sky-400", chip: "border-sky-400/30 bg-sky-400/10 text-sky-200" },
  { key: "QUALIFIED", label: "Qualifié", dot: "bg-violet-400", chip: "border-violet-400/30 bg-violet-400/10 text-violet-200" },
  { key: "WON", label: "Gagné", dot: "bg-emerald-400", chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  { key: "LOST", label: "Perdu", dot: "bg-white/30", chip: "border-white/10 bg-white/[.04] text-white/50" },
];
const STATUS_BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s])) as Record<LeadStatus, (typeof STATUSES)[number]>;

const SOURCE_LABEL: Record<string, string> = {
  CTA_FORM: "Bouton d’une capsule",
  CONTACT_FORM: "Formulaire de contact",
  PUBLIC_CTA: "Capsule",
  DIRECT: "Direct",
};

const INPUT =
  "rounded-xl border border-white/10 bg-[#0B0D10] px-3 py-2 text-sm text-[#F7F4EE] placeholder:text-white/30 outline-none focus:border-[#C6A15B]/60 focus:ring-2 focus:ring-[#C6A15B]/20";

async function fetchLeads(status: LeadStatus | "ALL", q: string, cursor: string | null): Promise<Page> {
  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  try {
    const res = await fetch(`/api/leads?${params}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { leads: [], counts: null, nextCursor: null, error: typeof json.error === "string" ? json.error : "Chargement impossible." };
    return { leads: json.leads ?? [], counts: json.counts ?? null, nextCursor: json.nextCursor ?? null, error: null };
  } catch {
    return { leads: [], counts: null, nextCursor: null, error: "Serveur injoignable." };
  }
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default function LeadsPage() {
  const [status, setStatus] = useState<LeadStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const key = `${status}|${q}`;
  const [page, setPage] = useState<Page & { key: string }>({ key: "", leads: [], counts: null, nextCursor: null, error: null });
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setQ(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    fetchLeads(status, q, null).then((p) => {
      if (!cancelled) setPage({ key, ...p });
    });
    return () => {
      cancelled = true;
    };
  }, [key, status, q]);

  const loading = page.key !== key;
  const counts = page.counts;
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  const loadMore = useCallback(async () => {
    if (!page.nextCursor) return;
    setLoadingMore(true);
    const next = await fetchLeads(status, q, page.nextCursor);
    setPage((p) => (p.key === key ? { ...p, leads: [...p.leads, ...next.leads], nextCursor: next.nextCursor } : p));
    setLoadingMore(false);
  }, [key, status, q, page.nextCursor]);

  async function changeStatus(lead: Lead, next: LeadStatus) {
    const previous = lead.status;
    if (previous === next) return;
    setNotice("");
    // Mise à jour immédiate, annulée si le serveur refuse.
    setPage((p) => ({
      ...p,
      leads: p.leads.map((l) => (l.id === lead.id ? { ...l, status: next } : l)),
      counts: p.counts ? { ...p.counts, [previous]: p.counts[previous] - 1, [next]: p.counts[next] + 1 } : p.counts,
    }));
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, status: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setPage((p) => ({
        ...p,
        leads: p.leads.map((l) => (l.id === lead.id ? { ...l, status: previous } : l)),
        counts: p.counts ? { ...p.counts, [previous]: p.counts[previous] + 1, [next]: p.counts[next] - 1 } : p.counts,
      }));
      setNotice(`Le statut de ${lead.name} n’a pas pu être modifié. Réessayez.`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Leads</p>
        <h1 className="mt-2 text-3xl font-semibold">Transformez l’attention en clients.</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">
          Chaque visiteur qui clique sur un bouton de vos capsules ou vous écrit via votre profil apparaît ici, avec
          l’offre qui l’intéresse.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[{ key: "ALL" as const, label: "Tous", dot: "bg-white/60" }, ...STATUSES].map((s) => {
          const value = s.key === "ALL" ? total : counts?.[s.key] ?? 0;
          const active = status === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatus(s.key)}
              aria-pressed={active}
              className={`rounded-2xl border p-4 text-left transition ${
                active ? "border-[#C6A15B]/60 bg-[#C6A15B]/[.08]" : "border-white/10 bg-white/[.035] hover:border-white/20"
              }`}
            >
              <span className="flex items-center gap-2 text-xs text-white/50">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
                {s.label}
              </span>
              <span className="mt-1 block text-2xl font-semibold tabular-nums">{counts ? value : "—"}</span>
            </button>
          );
        })}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un nom, un e-mail, un téléphone, un message…"
        aria-label="Rechercher un lead"
        className={`${INPUT} w-full sm:max-w-md`}
      />

      {notice && (
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">
          {notice}
        </p>
      )}

      {page.error && !loading ? (
        <p className="rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{page.error}</p>
      ) : loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[.035]" />
          ))}
        </div>
      ) : page.leads.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[.035] p-10 text-center">
          <p className="font-medium">
            {q || status !== "ALL" ? "Aucun lead ne correspond à ces filtres." : "Aucun lead pour l’instant."}
          </p>
          {!q && status === "ALL" && (
            <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
              Publiez une capsule : quand un visiteur clique sur un bouton sans lien (ex. « Demander un devis ») ou
              utilise votre formulaire de contact, sa demande arrive ici.
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[.02]">
          {page.leads.map((l) => {
            const st = STATUS_BY_KEY[l.status] ?? STATUS_BY_KEY.NEW;
            const wa = l.phone ? whatsappHref(l.phone) : null;
            const open = expanded === l.id;
            return (
              <li key={l.id} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_170px] md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{l.name}</h2>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${st.chip}`}>{st.label}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="text-[#E2C68E] hover:underline">
                        {l.email}
                      </a>
                    )}
                    {l.phone && (
                      <a href={`tel:${l.phone.replace(/\s+/g, "")}`} className="text-[#E2C68E] hover:underline">
                        {l.phone}
                      </a>
                    )}
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">
                        WhatsApp ↗
                      </a>
                    )}
                  </div>
                  {l.message && (
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : l.id)}
                      aria-expanded={open}
                      className={`mt-3 block w-full text-left text-sm text-white/60 ${open ? "whitespace-pre-line" : "line-clamp-2"}`}
                    >
                      {l.message}
                    </button>
                  )}
                </div>

                <div className="space-y-1 text-xs text-white/45">
                  <p>
                    <span className="text-white/70">{l.identity.name}</span>
                  </p>
                  {l.capsule && (
                    <p className="truncate" title={`${l.capsule.title}${l.branchLabel ? ` → ${l.branchLabel}` : ""}`}>
                      {l.capsule.title}
                      {l.branchLabel && <span className="text-[#E2C68E]"> → {l.branchLabel}</span>}
                    </p>
                  )}
                  <p>{SOURCE_LABEL[l.source] ?? l.source}</p>
                  <p>{formatDate(l.createdAt)}</p>
                </div>

                <label className="text-xs text-white/45">
                  <span className="sr-only">Statut de {l.name}</span>
                  <select
                    value={l.status}
                    onChange={(e) => changeStatus(l, e.target.value as LeadStatus)}
                    className={`${INPUT} h-10 w-full`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {page.nextCursor && !loading && (
        <div className="text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={loadMore}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-white/25 disabled:opacity-45"
          >
            {loadingMore ? "Chargement…" : "Afficher plus"}
          </button>
        </div>
      )}
    </div>
  );
}
