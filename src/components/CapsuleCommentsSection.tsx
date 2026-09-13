"use client";

import { useCallback, useEffect, useState } from "react";

type PublicReply = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type PublicItem = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  reply: PublicReply | null;
};

type Props = {
  capsuleId: string;
  enabled: boolean;
  accentGradient: string;
  accentText: string;
};

export function CapsuleCommentsSection({ capsuleId, enabled, accentGradient, accentText }: Props) {
  const [items, setItems] = useState<PublicItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/capsules/${capsuleId}/comments`);
      if (!res.ok) {
        setItems([]);
        setTotal(0);
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.totalApproved ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [capsuleId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!enabled) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/capsules/${capsuleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim() || undefined,
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormMsg({ kind: "err", text: data.error || "Envoi impossible" });
        return;
      }
      setFormMsg({ kind: "ok", text: data.message || "Merci pour votre message." });
      setBody("");
      void load();
    } catch {
      setFormMsg({ kind: "err", text: "Erreur réseau" });
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-6 mt-16" aria-labelledby="capsule-comments-heading">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${accentGradient}`} />
          <div>
            <h2 id="capsule-comments-heading" className="text-lg font-bold text-white">
              Commentaires
            </h2>
            <p className={`text-sm ${accentText} mt-0.5 font-medium`}>
              {total === 0 ? "Soyez le premier à réagir" : `${total} commentaire${total > 1 ? "s" : ""} publié${total > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/50 backdrop-blur-xl overflow-hidden shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
        <div className="p-6 sm:p-8 border-b border-white/[0.06]">
          {loading ? (
            <p className="text-sm text-zinc-500 text-center py-8">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">
              Aucun commentaire public encore. Partagez votre avis ci-dessous (affichage après modération).
            </p>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.id} className="rounded-2xl border border-white/[0.06] bg-zinc-900/[0.02] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accentGradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                      >
                        {item.authorName[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.authorName}</p>
                        <time className="text-[11px] text-zinc-500" dateTime={item.createdAt}>
                          {formatDate(item.createdAt)}
                        </time>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{item.body}</p>
                  {item.reply && (
                    <div className="mt-4 ml-2 pl-4 border-l-2 border-white/15 rounded-r-lg bg-zinc-900/[0.03] py-3 pr-3">
                      <p className="text-xs font-semibold text-[#C6A15B] mb-1">{item.reply.authorName}</p>
                      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{item.reply.body}</p>
                      <time className="text-[10px] text-zinc-600 mt-2 block" dateTime={item.reply.createdAt}>
                        {formatDate(item.reply.createdAt)}
                      </time>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6 sm:p-8 bg-gradient-to-b from-transparent to-black/20">
          <h3 className="text-sm font-semibold text-white mb-1">Laisser un commentaire</h3>
          <p className="text-xs text-zinc-500 mb-5">
            Votre message sera vérifié par le créateur avant publication. L’e-mail reste confidentiel et n’apparaît pas
            publiquement.
          </p>
          {formMsg && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                formMsg.kind === "ok"
                  ? "border-[#C6A15B]/30 bg-[#C6A15B]/10 text-[#C6A15B]"
                  : "border-[#C6A15B]/30 bg-[#C6A15B]/10 text-[#C6A15B]"
              }`}
            >
              {formMsg.text}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Nom ou prénom *</label>
                <input
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={120}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-900/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40"
                  placeholder="Comment vous appeler"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">
                  E-mail <span className="text-zinc-600 normal-case">(optionnel)</span>
                </label>
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-900/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40"
                  placeholder="pour vous recontacter si besoin"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Message *</label>
              <textarea
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                minLength={3}
                maxLength={2000}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-900/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40"
                placeholder="Votre retour, question ou encouragement…"
              />
              <p className="text-[10px] text-zinc-600 text-right mt-1">{body.length} / 2000</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full sm:w-auto rounded-2xl bg-gradient-to-r ${accentGradient} px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            >
              {submitting ? "Envoi…" : "Envoyer pour modération"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
