"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type VerifyOk = {
  ok: true;
  expiresAt: string;
  lockedToEmail: boolean;
  maskedInviteeEmail: string | null;
};

export function StudioInviteAcceptClient({ token }: { token: string }) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "done">("loading");
  const [meta, setMeta] = useState<VerifyOk | null>(null);
  const [msg, setMsg] = useState("");
  const [accepting, setAccepting] = useState(false);
    const nextPath = `/invite/studio/${token}`;
    const nextLogin = `/login?next=${encodeURIComponent(nextPath)}`;
    const nextRegister = `/register?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/studio/invites/verify?token=${encodeURIComponent(token)}`);
      const json = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setPhase("error");
        setMsg(typeof json.error === "string" ? json.error : "Lien invalide ou expiré.");
        return;
      }
      setMeta(json as VerifyOk);
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept() {
    setAccepting(true);
    setMsg("");
    const res = await fetch("/api/studio/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });
    const json = await res.json().catch(() => ({}));
    setAccepting(false);

    if (res.status === 401) {
      setMsg("Connectez-vous pour accepter l’invitation.");
      return;
    }

    if (!res.ok) {
      setMsg(typeof json.error === "string" ? json.error : "Impossible d’accepter.");
      return;
    }

    setPhase("done");
    setMsg(typeof json.message === "string" ? json.message : "Invitation acceptée.");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/45 p-8 shadow-lg shadow-black/50">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bordeaux-100 font-bold text-bordeaux-800">
            F
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Invitation Studio</h1>
            <p className="text-xs text-zinc-500">Faymoos — mandat partenaire</p>
          </div>
        </div>

        {phase === "loading" && (
          <p className="text-sm text-zinc-400">Vérification du lien…</p>
        )}

        {phase === "error" && (
          <div className="space-y-4">
            <p className="text-sm text-[#C6A15B]">{msg}</p>
            <Link href="/dashboard" className="text-sm font-semibold text-bordeaux-700 hover:underline">
              Retour à l’accueil
            </Link>
          </div>
        )}

        {phase === "ready" && meta && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-zinc-300">
              Un organisme partenaire vous invite à <strong className="text-foreground">lier votre compte</strong> à son
              espace commercial. Vous gardez votre compte ; vous autorisez ce partenaire à gérer vos identités et capsules
              comme convenu avec lui (contrat, mandat).
            </p>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                · Expiration du lien :{" "}
                <span className="font-medium text-foreground">
                  {new Date(meta.expiresAt).toLocaleString("fr-FR")}
                </span>
              </li>
              {meta.lockedToEmail && meta.maskedInviteeEmail && (
                <li>
                  · Réservé au compte : <span className="font-medium text-foreground">{meta.maskedInviteeEmail}</span>
                </li>
              )}
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={accepting}
                onClick={accept}
                className="rounded-xl bg-bordeaux-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-bordeaux-900 disabled:opacity-50"
              >
                {accepting ? "Traitement…" : "Accepter et lier mon compte"}
              </button>
              <Link
                href={nextLogin}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-[#0B0D10]/5"
              >
                Me connecter
              </Link>
              <Link
                href={nextRegister}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-[#0B0D10]/5"
              >
                Créer un compte
              </Link>
            </div>
            {msg && <p className="text-sm text-[#C6A15B]">{msg}</p>}
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4">
            <p className="text-sm text-[#C6A15B]">{msg}</p>
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl bg-bordeaux-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bordeaux-900"
            >
              Ouvrir mon tableau de bord
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
