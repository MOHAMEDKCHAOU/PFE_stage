"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

const POLL_INTERVAL = 15_000; // 15 seconds

function notifIconMeta(type: string): { box: string; glyph: string } {
  if (type === "CTA_CLICK") return { box: "bg-emerald-500/15 text-emerald-400", glyph: "🎯" };
  if (type === "NEW_CAPSULE_COMMENT") return { box: "bg-violet-500/15 text-violet-600", glyph: "📝" };
  return { box: "bg-bordeaux-500/15 text-bordeaux-300", glyph: "💬" };
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [browserNotifEnabled, setBrowserNotifEnabled] = useState(false);
  const prevUnreadRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkI2DdWdrf4eLi4N4b2p0gIqRjoV7cGxzf4mRj4Z9c25zfoiQj4iBd3JzfISOi4V/eHV2fIKIiYaDf3t4eX2ChIWEg4B+fHt8fYCCg4OCgX9+fXx9f4GCgoKBgH9+fX1+gIGBgoGAgH9+fn5/gIGBgYGAgH9+fn5/gIGBgYCAgH9+fn9/gICBgYCAgH9/fn9/gICAgYCAgH9/fn9/gICAgYCAgH9/f39/gICAgICAgH9/f39/gICAgICAgH9/f39/gICAgICAgH9/f39/gICAgICAgH9/f39/gICAgICAgH9/f39/gICAgICA");
    audioRef.current.volume = 0.5;
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const sound = localStorage.getItem("faymoos_notif_sound");
    if (sound === "true") setSoundEnabled(true);

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const browser = localStorage.getItem("faymoos_notif_browser");
      if (browser === "true") setBrowserNotifEnabled(true);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Show browser notification
  const showBrowserNotif = useCallback(
    (title: string, body: string) => {
      if (browserNotifEnabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    },
    [browserNotifEnabled]
  );

  // Fetch notifications (full list)
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);

      // If new unread notifications arrived, play sound + browser notif
      if (data.unread > prevUnreadRef.current) {
        playSound();
        const newest = (data.notifications || [])[0];
        if (newest && !newest.isRead) {
          showBrowserNotif(newest.title, newest.body);
        }
      }
      prevUnreadRef.current = data.unread || 0;
    } catch {
      // silent
    }
  }, [playSound, showBrowserNotif]);

  // Poll for notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark single notification as read + navigate
  async function handleClick(notif: Notification) {
    if (!notif.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (notif.link) router.push(notif.link);
  }

  // Mark all as read
  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  // Toggle sound
  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("faymoos_notif_sound", String(next));
    // Play a test sound when enabling
    if (next && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }

  // Toggle browser notifications
  async function toggleBrowserNotif() {
    if (!browserNotifEnabled) {
      if (typeof Notification === "undefined") return;
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setBrowserNotifEnabled(true);
        localStorage.setItem("faymoos_notif_browser", "true");
      }
    } else {
      setBrowserNotifEnabled(false);
      localStorage.setItem("faymoos_notif_browser", "false");
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2.5 text-amber-400/90 hover:bg-bordeaux-500/10 hover:text-bordeaux-200 transition-colors"
        title="Notifications"
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 shadow-lg shadow-black/40 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-bordeaux-800 hover:text-bordeaux-600 transition-colors"
                >
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          {/* Settings row */}
          <div className="flex items-center gap-3 border-b border-white/5 bg-bordeaux-50/30 px-4 py-2">
            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                soundEnabled
                  ? "bg-bordeaux-100 text-bordeaux-900"
                  : "border border-white/10 bg-zinc-900/45 text-zinc-500 hover:text-foreground"
              }`}
              title={soundEnabled ? "Son activé" : "Son désactivé"}
            >
              {soundEnabled ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              )}
              Son
            </button>

            {/* Browser notification toggle */}
            <button
              onClick={toggleBrowserNotif}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                browserNotifEnabled
                  ? "bg-bordeaux-100 text-bordeaux-900"
                  : "border border-white/10 bg-zinc-900/45 text-zinc-500 hover:text-foreground"
              }`}
              title={browserNotifEnabled ? "Notifications desktop activées" : "Notifications desktop désactivées"}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 006 0v-1.007m6-.002H3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31" />
              </svg>
              Desktop
            </button>
          </div>

          {/* Notification list */}
          <div className="max-h-[340px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="mx-auto h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <p className="mt-2 text-sm text-zinc-500">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const meta = notifIconMeta(notif.type);
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-bordeaux-50/50 ${
                      !notif.isRead ? "bg-bordeaux-50/40" : ""
                    }`}
                  >
                  {/* Dot */}
                  <div className="mt-1.5 flex-shrink-0 w-2">
                    {!notif.isRead && (
                      <div className="h-2 w-2 rounded-full bg-bordeaux-500" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-sm ${meta.box}`}
                  >
                    {meta.glyph}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!notif.isRead ? "font-semibold text-foreground" : "text-zinc-400"}`}>
                      {notif.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                      {notif.body}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
