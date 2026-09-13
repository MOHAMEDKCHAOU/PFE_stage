"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  name: string;
  email: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  identity: { name: string; slug: string; type: string };
};

const typeIcons: Record<string, string> = {
  FREELANCER: "💼",
  AGENCY: "🏢",
  CREATOR: "🎨",
  STARTUP: "🚀",
};

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => { if (data) setMessages(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function toggleRead(msg: Message) {
    const res = await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msg.id, isRead: !msg.isRead }),
    });
    if (res.ok) {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isRead: !m.isRead } : m));
    }
  }

  async function deleteMessage(id: string) {
    const res = await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (expanded === id) setExpanded(null);
    }
  }

  const filtered = messages.filter((m) => {
    if (filter === "unread") return !m.isRead;
    if (filter === "read") return m.isRead;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F7F4EE]">Messages</h1>
          <p className="text-sm text-white/48 mt-1">
            {unreadCount > 0
              ? `${unreadCount} message${unreadCount > 1 ? "s" : ""} non lu${unreadCount > 1 ? "s" : ""}`
              : "Tous les messages sont lus"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/messages/export"
            className="rounded-xl border border-[#C6A15B]/30 bg-zinc-900/45 px-4 py-2 text-sm font-medium text-[#C6A15B] shadow-sm transition hover:bg-[#C6A15B]/10"
          >
            Exporter CSV
          </a>
          <div className="flex gap-1.5 rounded-xl bg-zinc-900/45 border border-[#C6A15B]/30 p-1">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                filter === f
                  ? "bg-[#C6A15B]/15 text-[#C6A15B] shadow-sm"
                  : "text-white/48 hover:text-white/80"
              }`}
            >
              {f === "all" ? "Tous" : f === "unread" ? "Non lus" : "Lus"}
              {f === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-[#C6A15B] text-[10px] font-bold text-[#0B0D10] px-1">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#C6A15B]/30 bg-zinc-900/45 p-5 animate-pulse">
              <div className="h-4 w-1/3 bg-[#C6A15B]/15 rounded" />
              <div className="h-3 w-2/3 bg-[#C6A15B]/10 rounded mt-3" />
              <div className="h-3 w-1/2 bg-[#C6A15B]/10 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="mx-auto h-16 w-16 text-white/28" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-white/35">Aucun message</h3>
          <p className="mt-1 text-sm text-white/35">
            {filter !== "all" ? "Changez le filtre pour voir d'autres messages." : "Les messages de vos visiteurs apparaîtront ici."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl border bg-zinc-900/45 transition-all duration-200 ${
                !msg.isRead
                  ? "border-[#C6A15B]/30 shadow-sm shadow-[#C6A15B]/20"
                  : "border-[#C6A15B]/30"
              }`}
            >
              {/* Header row */}
              <button
                onClick={() => {
                  setExpanded(expanded === msg.id ? null : msg.id);
                  if (!msg.isRead) toggleRead(msg);
                }}
                className="w-full text-left px-5 py-4 flex items-center gap-4"
              >
                {/* Unread dot */}
                <div className="flex-shrink-0 w-2.5">
                  {!msg.isRead && (
                    <div className="h-2.5 w-2.5 rounded-full bg-[#C6A15B]/100 animate-pulse" />
                  )}
                </div>

                {/* Avatar */}
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#C6A15B] to-[#C6A15B] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {msg.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm truncate ${!msg.isRead ? "font-bold text-[#F7F4EE]" : "font-medium text-white/80"}`}>
                      {msg.name}
                    </span>
                    <span className="text-[10px] text-white/35 flex-shrink-0">
                      {new Date(msg.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-white/48 truncate mt-0.5">{msg.content}</p>
                </div>

                {/* Identity badge */}
                <span className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-[#C6A15B]/10 px-2.5 py-1 text-[10px] font-medium text-[#C6A15B] flex-shrink-0">
                  {typeIcons[msg.identity.type] || "📄"} {msg.identity.name}
                </span>

                {/* Chevron */}
                <svg
                  className={`h-4 w-4 text-white/35 transition-transform flex-shrink-0 ${expanded === msg.id ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Expanded content */}
              {expanded === msg.id && (
                <div className="px-5 pb-5 border-t border-[#C6A15B]/30">
                  <div className="pt-4 space-y-4">
                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="h-4 w-4 text-[#C6A15B]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <a href={`mailto:${msg.email}`} className="text-[#C6A15B] hover:underline">{msg.email}</a>
                    </div>

                    {/* Full message */}
                    <div className="rounded-xl bg-[#C6A15B]/50 border border-[#C6A15B]/30 p-4">
                      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Identity info (mobile) */}
                    <div className="sm:hidden">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#C6A15B]/10 px-2.5 py-1 text-[10px] font-medium text-[#C6A15B]">
                        {typeIcons[msg.identity.type] || "📄"} {msg.identity.name}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => toggleRead(msg)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#C6A15B]/30 bg-zinc-900/45 px-3 py-1.5 text-xs font-medium text-white/65 hover:bg-[#C6A15B]/10 transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          {msg.isRead ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                        {msg.isRead ? "Marquer non lu" : "Marquer lu"}
                      </button>
                      <a
                        href={`mailto:${msg.email}?subject=Re: Message via Faymoos`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#C6A15B] to-[#C6A15B] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        Répondre
                      </a>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#C6A15B]/30 bg-zinc-900/45 px-3 py-1.5 text-xs font-medium text-[#C6A15B] hover:bg-[#C6A15B]/10 transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
