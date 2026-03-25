"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UserInfo = {
  name: string;
  avatar: string | null;
};

export function Navbar() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const profile = data.identityProfiles?.[0];
        if (profile) {
          setUser({ name: profile.name, avatar: profile.avatar });
        } else {
          setUser({ name: data.email.split("@")[0], avatar: null });
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-violet-100/60 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-black text-white shadow-md shadow-violet-500/30">
            F
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800">
            Fay<span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">moos</span>
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/explore" className="text-sm text-slate-500 hover:text-violet-600 transition-colors font-medium">Explorer</Link>
          <a href="#features" className="text-sm text-slate-500 hover:text-violet-600 transition-colors">Fonctionnalités</a>
          <a href="#how-it-works" className="text-sm text-slate-500 hover:text-violet-600 transition-colors">Comment ça marche</a>
          <a href="#profiles" className="text-sm text-slate-500 hover:text-violet-600 transition-colors">Profils</a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!loaded ? (
            /* Skeleton while loading */
            <div className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
          ) : user ? (
            /* ── Logged in: avatar + name + logout ── */
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2.5 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-1.5 transition-all hover:bg-violet-50 hover:border-violet-200"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-bold text-white overflow-hidden ring-2 ring-violet-200">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <svg className={`h-4 w-4 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-violet-100 bg-white shadow-xl shadow-violet-500/10 py-1.5 animate-in">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-400">Connecté</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-all"
                      >
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/identities"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-all"
                      >
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        Mes Identités
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={async () => {
                          setMenuOpen(false);
                          await fetch("/api/logout", { method: "POST" });
                          window.location.href = "/";
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
              </div>

              {/* Logout button (always visible, same line) */}
              <button
                onClick={async () => {
                  await fetch("/api/logout", { method: "POST" });
                  window.location.href = "/";
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                title="Déconnexion"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          ) : (
            /* ── Not logged in: Connexion + Commencer ── */
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:text-violet-600"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-400 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98]"
              >
                Commencer
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
