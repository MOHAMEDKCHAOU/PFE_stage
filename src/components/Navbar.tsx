"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UserInfo = { name: string };

export function Navbar() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUser({ name: data.identityProfiles?.[0]?.name || data.email?.split("@")[0] || "Creator" }))
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0B0D10]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[#C6A15B]/40 bg-[#C6A15B]/10 text-lg font-black text-[#C6A15B]">F</span><div><div className="text-[15px] font-semibold">Faymoos</div><div className="text-[9px] uppercase tracking-[.17em] text-white/32">Identity with intent</div></div></Link>
        <div className="hidden items-center gap-7 md:flex"><a href="/#features" className="text-xs text-white/48 transition hover:text-[#F7F4EE]">Product</a><a href="/#how-it-works" className="text-xs text-white/48 transition hover:text-[#F7F4EE]">How it works</a><Link href="/explore" className="text-xs text-white/48 transition hover:text-[#F7F4EE]">Explore</Link></div>
        <div className="flex items-center gap-2">{loaded && user ? <><span className="hidden text-xs text-white/40 sm:inline">{user.name}</span><Link href="/dashboard" className="fay-button-primary px-4 py-2.5 text-xs">Open workspace</Link></> : <><Link href="/login" className="hidden px-3 py-2 text-xs text-white/55 sm:inline-flex">Sign in</Link><Link href="/register" className="fay-button-primary px-4 py-2.5 text-xs">Get started</Link></>}</div>
      </div>
    </nav>
  );
}
