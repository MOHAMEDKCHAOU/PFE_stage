"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Preview = {
  code: string;
  agencyName: string | null;
  logoUrl: string | null;
  partnerEmail: string;
  viewer: null | {
    isSelf: boolean;
    alreadyLinked: boolean;
    requestStatus: "PENDING" | "DECLINED" | null;
  };
};

type PreviewResult = { preview: Preview } | { error: string };

async function fetchPreview(code: string): Promise<PreviewResult> {
  try {
    const res = await fetch(`/api/studio/join/${encodeURIComponent(code)}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: typeof json.error === "string" ? json.error : "Code partenaire invalide." };
    return { preview: json as Preview };
  } catch {
    return { error: "Connexion impossible. Vérifiez votre réseau." };
  }
}

const CARD ="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.035] p-7 shadow-2xl shadow-black/40";
const BTN_PRIMARY =
  "inline-flex w-full items-center justify-center rounded-xl bg-[#C6A15B] px-5 py-3 text-sm font-semibold text-[#0B0D10] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45";
const BTN_SECONDARY =
  "inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/75 transition hover:border-[#C6A15B]/40 hover:text-white disabled:opacity-45";

export function JoinStudioClient({ code }: { code: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const nextPath = `/join/${encodeURIComponent(code)}`;

  const applyResult = useCallback((result: PreviewResult) => {
    if ("error" in result) setLoadError(result.error);
    else setPreview(result.preview);
  }, []);

  const load = useCallback(async () => applyResult(await fetchPreview(code)), [applyResult, code]);

  useEffect(() => {
    let cancelled = false;
    fetchPreview(code).then((result) => {
      if (!cancelled) applyResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [applyResult, code]);

  async function send(method: "POST" | "DELETE") {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/studio/join/${encodeURIComponent(code)}`, { method, credentials: "include" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Action impossible.");
      return;
    }
    setUnderstood(false);
    await load();
  }

  if (loadError) {
    return (
      <div className={CARD}>
        <p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Code partenaire</p>
        <h1 className="mt-3 text-xl font-semibold">Ce code ne fonctionne pas</h1>
        <p className="mt-2 text-sm text-white/55">{loadError} Demandez un nouveau QR code à votre partenaire.</p>
        <Link href="/" className={`${BTN_SECONDARY} mt-6`}>
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  if (!preview) {
    return <div className={`${CARD} h-80 animate-pulse`} aria-busy="true" aria-label="Chargement" />;
  }

  const name = preview.agencyName || preview.partnerEmail;
  const initials = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "S";
  const viewer = preview.viewer;

  return (
    <div className={CARD}>
      <div className="flex items-center gap-4">
        {preview.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.logoUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 object-cover"
          />
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#C6A15B]/30 bg-[#C6A15B]/10 text-lg font-semibold text-[#E2C68E]">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Partenaire Faymoos</p>
          <h1 className="mt-1 truncate text-xl font-semibold">{name}</h1>
          {preview.agencyName && <p className="truncate text-xs text-white/45">{preview.partnerEmail}</p>}
        </div>
      </div>

      {!viewer ? (
        <>
          <p className="mt-6 text-sm leading-relaxed text-white/60">
            Ce partenaire vous invite à rattacher votre compte Faymoos à son espace de gestion. Connectez-vous pour
            voir le détail et décider.
          </p>
          <div className="mt-6 space-y-2">
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className={BTN_PRIMARY}>
              Se connecter
            </Link>
            <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className={BTN_SECONDARY}>
              Créer un compte
            </Link>
          </div>
        </>
      ) : viewer.isSelf ? (
        <>
          <p className="mt-6 text-sm text-white/60">
            C’est votre propre QR code partenaire. Partagez-le avec vos clients pour qu’ils demandent à rejoindre
            votre espace.
          </p>
          <Link href="/dashboard/studio" className={`${BTN_SECONDARY} mt-6`}>
            Ouvrir Client Studio
          </Link>
        </>
      ) : viewer.alreadyLinked ? (
        <>
          <p className="mt-6 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            Votre compte est déjà rattaché à ce partenaire.
          </p>
          <Link href="/dashboard/settings/security" className={`${BTN_SECONDARY} mt-6`}>
            Gérer les accès partenaires
          </Link>
        </>
      ) : viewer.requestStatus === "PENDING" ? (
        <>
          <div className="mt-6 rounded-xl border border-[#C6A15B]/30 bg-[#C6A15B]/[.08] p-4">
            <p className="text-sm font-semibold text-[#E2C68E]">Demande envoyée</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              {name} doit maintenant valider votre demande. Vous recevrez une notification dès sa décision.
            </p>
          </div>
          <div className="mt-6 space-y-2">
            <Link href="/dashboard" className={BTN_PRIMARY}>
              Aller au tableau de bord
            </Link>
            <button type="button" disabled={busy} onClick={() => send("DELETE")} className={BTN_SECONDARY}>
              {busy ? "Annulation…" : "Annuler ma demande"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-white/10 bg-[#0B0D10] p-4">
            <p className="text-sm font-semibold">Si vous acceptez, {name} pourra :</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-white/60">
              <li>• modifier vos identités, portfolio et témoignages ;</li>
              <li>• créer, publier et supprimer vos capsules ;</li>
              <li>• lire vos messages et modérer vos commentaires.</li>
            </ul>
            <p className="mt-3 text-xs text-white/45">
              Il ne voit pas votre mot de passe. Vous pourrez retirer cet accès à tout moment depuis Paramètres →
              Sécurité.
            </p>
          </div>

          {viewer.requestStatus === "DECLINED" && (
            <p className="mt-4 text-xs text-white/45">Une précédente demande n’a pas été retenue par ce partenaire.</p>
          )}

          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#C6A15B]"
            />
            <span className="text-xs leading-relaxed text-white/65">
              Je connais ce partenaire et je souhaite lui confier la gestion de mon espace Faymoos.
            </span>
          </label>

          <div className="mt-6 space-y-2">
            <button type="button" disabled={!understood || busy} onClick={() => send("POST")} className={BTN_PRIMARY}>
              {busy ? "Envoi…" : "Demander le rattachement"}
            </button>
            <Link href="/dashboard" className={BTN_SECONDARY}>
              Refuser
            </Link>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-xs text-red-200">
          {error}
        </p>
      )}

      <p className="mt-6 text-center font-mono text-[11px] text-white/30">Code {preview.code}</p>
    </div>
  );
}
