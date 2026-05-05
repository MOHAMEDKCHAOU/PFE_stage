"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import QRCode from "qrcode";
import { generatePortfolioPDF } from "@/lib/generatePDF";
import { ChatBot } from "@/components/ChatBot";
import { CapsuleCommentsSection } from "@/components/CapsuleCommentsSection";
import { PublicProfileBadges } from "@/components/PublicProfileBadges";
import type { PublicBadgeBundle } from "@/lib/faymoos-badges";

function readJourneyImmersed(capsuleId: string, optionCount: number): boolean {
  if (optionCount === 0) return true;
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(`faymoos_journey_${capsuleId}`) === "1";
  } catch {
    return false;
  }
}

/* ───────── Types ───────── */
type Branch = {
  headline: string;
  description: string;
  cta: string;
  proof: string | null;
};

type Option = { id: string; label: string; branch: Branch | null };

type Capsule = {
  id: string;
  title: string;
  objective: string;
  commentsEnabled: boolean;
  options: Option[];
};

type Project = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  year: number | null;
};

type Testimonial = {
  id: string;
  author: string;
  content: string;
  role: string | null;
  company: string | null;
};

type CapsuleViewerProps = {
  hideBranding?: boolean;
  identitySlug: string;
  badges?: PublicBadgeBundle | null;
  identity: {
    id: string;
    name: string;
    headline: string | null;
    bio: string | null;
    avatar: string | null;
    cover: string | null;
    type: string;
    theme: string | null;
    socialLinks: Record<string, string> | null;
  };
  capsules: Capsule[];
  projects: Project[];
  testimonials: Testimonial[];
};

const socialIcons: Record<string, { label: string; svg: string }> = {
  linkedin: { label: "LinkedIn", svg: `<path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>` },
  github: { label: "GitHub", svg: `<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>` },
  twitter: { label: "X", svg: `<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>` },
  dribbble: { label: "Dribbble", svg: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.245.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"/>` },
  website: { label: "Site web", svg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" fill="none" stroke="currentColor" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18"/>` },
  behance: { label: "Behance", svg: `<path d="M22 7h-7V5h7zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 11h3.584c2.508 0 2.906-3-.312-3H3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z"/>` },
};

const typeConfig: Record<string, { label: string; gradient: string; accent: string }> = {
  FREELANCER: { label: "Freelancer", gradient: "from-blue-600 to-cyan-500", accent: "text-cyan-400" },
  AGENCY: { label: "Agence", gradient: "from-violet-600 to-purple-500", accent: "text-violet-400" },
  CREATOR: { label: "Créateur", gradient: "from-pink-600 to-rose-500", accent: "text-pink-400" },
  STARTUP: { label: "Startup", gradient: "from-emerald-600 to-teal-500", accent: "text-emerald-400" },
};

const themeOverrides: Record<string, { gradient: string; accent: string }> = {
  ocean:    { gradient: "from-sky-500 to-cyan-500",     accent: "text-sky-400" },
  sunset:   { gradient: "from-orange-500 to-red-500",   accent: "text-orange-400" },
  forest:   { gradient: "from-green-500 to-teal-500",   accent: "text-green-400" },
  berry:    { gradient: "from-pink-500 to-purple-500",   accent: "text-pink-400" },
  gold:     { gradient: "from-yellow-500 to-amber-500", accent: "text-yellow-400" },
  midnight: { gradient: "from-blue-500 to-indigo-500",  accent: "text-blue-400" },
  coral:    { gradient: "from-rose-400 to-pink-400",    accent: "text-rose-400" },
};

/* ───────── Component ───────── */
export function CapsuleViewer({
  identity,
  capsules,
  projects,
  testimonials,
  hideBranding = false,
  identitySlug,
  badges = null,
}: CapsuleViewerProps) {
  const [activeCapsule, setActiveCapsule] = useState<Capsule>(capsules[0]);
  const [journeyImmersed, setJourneyImmersed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: "", email: "", content: "" });
  const [contactSending, setContactSending] = useState(false);
  const [contactStatus, setContactStatus] = useState<"idle" | "success" | "error">("idle");
  const [contactError, setContactError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const baseTC = typeConfig[identity.type] || typeConfig.FREELANCER;
  const themeOv = identity.theme ? themeOverrides[identity.theme] : null;
  const tc = themeOv ? { ...baseTC, ...themeOv } : baseTC;
  const shareBlurb = hideBranding
    ? `Découvrez ${identity.name}`
    : `Découvrez ${identity.name} sur Faymoos`;

  const showJourneyMap = activeCapsule.options.length > 0 && !journeyImmersed;

  useLayoutEffect(() => {
    setJourneyImmersed(readJourneyImmersed(activeCapsule.id, activeCapsule.options.length));
  }, [activeCapsule.id, activeCapsule.options.length]);

  function beginCapsuleExperience() {
    try {
      sessionStorage.setItem(`faymoos_journey_${activeCapsule.id}`, "1");
    } catch {
      /* ignore */
    }
    setJourneyImmersed(true);
  }

  function reopenIntroduction() {
    try {
      sessionStorage.removeItem(`faymoos_journey_${activeCapsule.id}`);
    } catch {
      /* ignore */
    }
    setJourneyImmersed(false);
  }

  // Check favorites
  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : []))
      .then((favs) => {
        if (Array.isArray(favs)) {
          setIsFavorited(favs.some((f: { capsule: { id: string } }) => f.capsule.id === activeCapsule.id));
        }
      })
      .catch(() => {});
  }, [activeCapsule.id]);

  // Start analytics session (après immersion ou capsule sans options interactives)
  useEffect(() => {
    if (activeCapsule.options.length > 0 && !journeyImmersed) return;
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "START", capsuleId: activeCapsule.id }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.sessionId) sessionIdRef.current = d.sessionId; })
      .catch(() => {});
  }, [activeCapsule.id, activeCapsule.options.length, journeyImmersed]);

  function trackEvent(action: string, label?: string) {
    if (!sessionIdRef.current) return;
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, capsuleId: activeCapsule.id, sessionId: sessionIdRef.current, optionLabel: label }),
    }).catch(() => {});
  }

  async function toggleFavorite() {
    setFavLoading(true);
    if (isFavorited) {
      const r = await fetch(`/api/favorites?capsuleId=${activeCapsule.id}`, { method: "DELETE" });
      if (r.ok) setIsFavorited(false);
    } else {
      const r = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capsuleId: activeCapsule.id }),
      });
      if (r.ok || r.status === 409) setIsFavorited(true);
    }
    setFavLoading(false);
  }

  function handleSelect(option: Option) {
    if (selectedOption?.id === option.id) return handleBack();
    trackEvent("OPTION_CLICK", option.label);
    setIsTransitioning(true);
    setTimeout(() => { setSelectedOption(option); setIsTransitioning(false); }, 250);
  }

  function handleBack() {
    setIsTransitioning(true);
    setTimeout(() => { setSelectedOption(null); setIsTransitioning(false); }, 250);
  }

  function switchCapsule(c: Capsule) {
    if (c.id === activeCapsule.id) return;
    setSelectedOption(null);
    setActiveCapsule(c);
    sessionIdRef.current = null;
  }

  const generateQR = useCallback(() => {
    if (!qrCanvasRef.current || !showQR) return;
    QRCode.toCanvas(qrCanvasRef.current, window.location.href, {
      width: 280,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    });
  }, [showQR]);

  useEffect(() => { generateQR(); }, [generateQR]);

  function downloadQR() {
    if (!qrCanvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${identity.name.replace(/\s+/g, "-")}-qrcode.png`;
    link.href = qrCanvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="relative">
      {/* ──── Animated background ──── */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className={`absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br ${tc.gradient} opacity-[0.07] blur-[120px] animate-pulse`} />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 opacity-[0.05] blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%220.5%22%20fill%3D%22%23ffffff08%22%2F%3E%3C%2Fsvg%3E')] opacity-40" />
      </div>

      {/* ──── Hero Section ──── */}
      <section className="relative">
        {/* Cover */}
        <div className="h-48 sm:h-64 relative overflow-hidden">
          {identity.cover ? (
            <img src={identity.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${tc.gradient} opacity-30`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>

        {/* Profile info */}
        <div className="relative max-w-3xl mx-auto px-6 -mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div className={`relative h-28 w-28 rounded-2xl overflow-hidden ring-4 ring-zinc-950 shadow-2xl flex-shrink-0 ${!identity.avatar ? `bg-gradient-to-br ${tc.gradient}` : ""}`}>
              {identity.avatar ? (
                <img src={identity.avatar} alt={identity.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                  {identity.name[0]}
                </span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 text-center sm:text-left pb-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {identity.name}
                </h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${tc.accent}`}>
                  {tc.label}
                </span>
              </div>
              {identity.headline && (
                <p className="mt-1.5 text-sm text-zinc-400 max-w-md">{identity.headline}</p>
              )}
              {badges ? (
                <div className="mt-4 w-full max-w-xl mx-auto sm:mx-0">
                  <PublicProfileBadges identitySlug={identitySlug} bundle={badges} />
                </div>
              ) : null}
            </div>

            {/* Fav button */}
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={`group flex-shrink-0 rounded-xl p-3 transition-all duration-200 ${
                isFavorited
                  ? "bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30 hover:bg-pink-500/25"
                  : "bg-white/5 text-zinc-500 ring-1 ring-white/10 hover:text-pink-400 hover:ring-pink-500/30 hover:bg-pink-500/5"
              } disabled:opacity-50`}
              title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <svg className="h-5 w-5" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>

            {/* QR Code button */}
            <button
              onClick={() => setShowQR(true)}
              className="group flex-shrink-0 rounded-xl p-3 bg-white/5 text-zinc-500 ring-1 ring-white/10 hover:text-white hover:ring-white/30 hover:bg-white/10 transition-all duration-200"
              title="QR Code"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
              </svg>
            </button>

            {/* Download PDF button */}
            <button
              onClick={() => {
                setPdfLoading(true);
                setTimeout(() => {
                  generatePortfolioPDF({ identity, capsules, projects, testimonials });
                  setPdfLoading(false);
                }, 100);
              }}
              disabled={pdfLoading}
              className="group flex-shrink-0 rounded-xl p-3 bg-white/5 text-zinc-500 ring-1 ring-white/10 hover:text-white hover:ring-white/30 hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
              title="Télécharger le portfolio en PDF"
            >
              {pdfLoading ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              )}
            </button>
          </div>

          {/* Bio */}
          {identity.bio && (
            <p className="mt-6 text-sm leading-relaxed text-zinc-400 max-w-2xl text-center sm:text-left">
              {identity.bio}
            </p>
          )}

          {/* Social Links + Share */}
          <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {/* Social links */}
            {identity.socialLinks && Object.entries(identity.socialLinks).map(([key, url]) => {
              const icon = socialIcons[key];
              if (!icon || !url) return null;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group h-9 w-9 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 hover:ring-white/20 transition-all"
                  title={icon.label}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                </a>
              );
            })}

            {/* Divider */}
            {identity.socialLinks && Object.keys(identity.socialLinks).length > 0 && (
              <div className="h-5 w-px bg-zinc-800 mx-1" />
            )}

            {/* Share button */}
            <div className="relative">
              <button
                onClick={() => setShowShare(!showShare)}
                className="h-9 px-3.5 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center gap-1.5 text-zinc-500 hover:text-white hover:bg-white/10 hover:ring-white/20 transition-all text-xs font-medium"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Partager
              </button>

              {showShare && (
                <div className="absolute top-full mt-2 right-0 sm:left-0 z-50 w-56 rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50 p-2 space-y-1">
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(shareBlurb);
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "width=600,height=400");
                      setShowShare(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>
                    LinkedIn
                  </button>
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(shareBlurb);
                      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank", "width=600,height=400");
                      setShowShare(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <svg className="h-4 w-4 text-zinc-300" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X / Twitter
                  </button>
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(shareBlurb);
                      window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
                      setShowShare(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                      setShowShare(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364l4.5 4.5a4.5 4.5 0 006.364-6.364l-1.757-1.757" />
                    </svg>
                    {linkCopied ? "Lien copié !" : "Copier le lien"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ──── Capsule Tabs (multi-capsule) ──── */}
      {capsules.length > 1 && (
        <div className="max-w-3xl mx-auto px-6 mt-10">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {capsules.map((c) => (
              <button
                key={c.id}
                onClick={() => switchCapsule(c)}
                className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  c.id === activeCapsule.id
                    ? `bg-gradient-to-r ${tc.gradient} text-white shadow-lg shadow-indigo-500/20`
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white ring-1 ring-white/5"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ──── Introduction (avant l’expérience interactive) — sans graphe visuel ──── */}
      {showJourneyMap && (
        <section className="max-w-3xl mx-auto px-6 mt-10">
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-transparent p-[1px] shadow-[0_28px_80px_-20px_rgba(0,0,0,0.75)]">
            <div className="relative overflow-hidden rounded-[27px] bg-zinc-950/80 px-6 py-9 backdrop-blur-2xl sm:px-10 sm:py-10">
              <div
                className={`pointer-events-none absolute -top-32 right-0 h-64 w-64 rounded-full bg-gradient-to-br ${tc.gradient} opacity-[0.12] blur-3xl`}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative text-center">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 shadow-lg shadow-black/20">
                  <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${tc.gradient} animate-pulse shadow-[0_0_12px_rgba(236,72,153,0.6)]`} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300">
                    Avant de commencer
                  </span>
                </div>
                <h2
                  className={`mt-5 bg-gradient-to-r ${tc.gradient} bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl`}
                >
                  {activeCapsule.title}
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
                  {activeCapsule.objective}
                </p>
                <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-zinc-500">
                  Vous pouvez aussi consulter ou laisser un commentaire ci-dessous (après modération). Ensuite : choix
                  interactifs, portfolio et contact.
                </p>
              </div>

              <div className="relative mt-10 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={beginCapsuleExperience}
                  className={`group/btn relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r ${tc.gradient} px-12 py-4 text-sm font-semibold text-white shadow-[0_16px_48px_-12px_rgba(99,102,241,0.55)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_22px_56px_-12px_rgba(236,72,153,0.45)] active:scale-[0.98]`}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                  <span className="relative flex items-center gap-2">
                    <svg className="h-5 w-5 opacity-95" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                    </svg>
                    Commencer l’expérience
                    <svg className="h-5 w-5 transition-transform group-hover/btn:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </button>
                <p className="max-w-md text-center text-xs leading-relaxed text-zinc-500">
                  {hideBranding
                    ? "Ensuite : choix interactifs, portfolio, témoignages, commentaires et formulaire de contact."
                    : "Ensuite : choix interactifs, portfolio, témoignages, commentaires et contact — tout le parcours Faymoos."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ──── Active Capsule ──── */}
      {!showJourneyMap && (
      <section
        className={`max-w-3xl mx-auto px-6 mt-8 transition-all duration-500 ease-out ${
          journeyImmersed ? "opacity-100 translate-y-0 scale-100" : ""
        }`}
      >
        <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Glow line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Question */}
          <div className="px-8 pt-10 pb-6 text-center">
            {activeCapsule.options.length > 0 && (
              <button
                type="button"
                onClick={reopenIntroduction}
                className="mb-4 text-xs font-medium text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
              >
                ← Retour à l’introduction
              </button>
            )}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-5">
              <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${tc.gradient} animate-pulse`} />
              <span className={`text-xs font-semibold uppercase tracking-widest ${tc.accent}`}>
                {activeCapsule.title}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {activeCapsule.objective}
            </h2>
          </div>

          {/* Content */}
          <div className={`px-8 pb-10 transition-all duration-250 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
            {!selectedOption ? (
              <div className="flex flex-col gap-3 mt-2">
                {activeCapsule.options.map((option, i) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className="group relative w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-5 text-left transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-black/20 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br ${tc.gradient} text-white text-sm font-bold shadow-lg`}>
                        {i + 1}
                      </span>
                      <span className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {option.label}
                      </span>
                      <svg className="ml-auto h-5 w-5 text-zinc-600 group-hover:text-white/60 transition-all group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2">
                {selectedOption.branch ? (
                  <div className="space-y-6">
                    {/* Selected pill */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium ${tc.accent}`}>
                        <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${tc.gradient}`} />
                        {selectedOption.label}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                      {selectedOption.branch.headline}
                    </h3>

                    <p className="text-zinc-400 leading-relaxed text-[15px]">
                      {selectedOption.branch.description}
                    </p>

                    {/* Proof */}
                    {selectedOption.branch.proof && (
                      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-5">
                        <div className="flex items-center gap-2 mb-2.5">
                          <svg className={`h-4 w-4 ${tc.accent}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`text-xs font-semibold uppercase tracking-widest ${tc.accent}`}>
                            Preuve
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {selectedOption.branch.proof}
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      onClick={() => trackEvent("CTA_CLICK", selectedOption!.label)}
                      className={`w-full rounded-2xl bg-gradient-to-r ${tc.gradient} px-6 py-4 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98]`}
                    >
                      {selectedOption.branch.cta}
                    </button>

                    {/* Back */}
                    <button onClick={handleBack} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mx-auto group">
                      <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                      Retour aux options
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-zinc-500">Pas encore de contenu pour cette option.</p>
                    <button onClick={handleBack} className="mt-4 text-sm text-zinc-500 hover:text-white transition-colors">
                      ← Retour aux options
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* ──── Portfolio Section ──── */}
      {!showJourneyMap && projects.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${tc.gradient}`} />
            <h2 className="text-lg font-bold text-white">Portfolio</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/15 transition-all">
                {p.image ? (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className={`aspect-[4/3] bg-gradient-to-br ${tc.gradient} opacity-20 flex items-center justify-center`}>
                    <span className="text-3xl opacity-60">📁</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white truncate">{p.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{p.description}</p>
                  {p.year && <span className="text-[10px] text-zinc-600 mt-2 block">{p.year}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ──── Testimonials Section ──── */}
      {!showJourneyMap && testimonials.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${tc.gradient}`} />
            <h2 className="text-lg font-bold text-white">Témoignages</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/15 transition-all">
                <svg className={`h-5 w-5 ${tc.accent} mb-3 opacity-50`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
                </svg>
                <p className="text-sm text-zinc-300 leading-relaxed">{t.content}</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${tc.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.author}</p>
                    {(t.role || t.company) && (
                      <p className="text-[11px] text-zinc-500">
                        {t.role}{t.role && t.company ? " · " : ""}{t.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ──── Commentaires publics (modération) — visibles dès l’intro, pas seulement après « Commencer » ──── */}
      <CapsuleCommentsSection
        capsuleId={activeCapsule.id}
        enabled={activeCapsule.commentsEnabled !== false}
        accentGradient={tc.gradient}
        accentText={tc.accent}
      />

      {/* ──── Contact Form ──── */}
      {!showJourneyMap && (
      <section className="max-w-3xl mx-auto px-6 mt-16">
        <div className="flex items-center gap-3 mb-6">
          <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${tc.gradient}`} />
          <h2 className="text-lg font-bold text-white">Contactez-moi</h2>
        </div>
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8">
          {contactStatus === "success" ? (
            <div className="text-center py-8">
              <div className={`mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br ${tc.gradient} flex items-center justify-center mb-4`}>
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Message envoyé !</h3>
              <p className="text-sm text-zinc-400 mt-1">Merci, votre message a bien été transmis.</p>
              <button
                onClick={() => { setContactStatus("idle"); setContactForm({ name: "", email: "", content: "" }); }}
                className="mt-4 text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setContactSending(true);
                setContactError("");
                try {
                  const res = await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...contactForm, identityId: identity.id }),
                  });
                  if (!res.ok) {
                    const d = await res.json();
                    setContactError(d.error || "Erreur lors de l'envoi");
                    setContactStatus("error");
                  } else {
                    setContactStatus("success");
                  }
                } catch {
                  setContactError("Erreur de connexion");
                  setContactStatus("error");
                } finally {
                  setContactSending(false);
                }
              }}
              className="space-y-5"
            >
              {contactError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {contactError}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Nom</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Votre nom"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="votre@email.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500">Message</label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.content}
                  onChange={(e) => setContactForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Votre message..."
                  maxLength={2000}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
                <p className="text-[11px] text-zinc-600 text-right">{contactForm.content.length}/2000</p>
              </div>
              <button
                type="submit"
                disabled={contactSending}
                className={`w-full rounded-2xl bg-gradient-to-r ${tc.gradient} px-6 py-4 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {contactSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Envoi...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Envoyer le message
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
      )}

      {/* ──── Footer ──── */}
      {!showJourneyMap && !hideBranding && (
      <footer className="max-w-3xl mx-auto px-6 mt-20 mb-10 text-center">
        <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-6" />
        <p className="text-xs text-zinc-700">
          Powered by{" "}
          <span className={`font-semibold ${tc.accent}`}>Faymoos Platform</span>
        </p>
      </footer>
      )}

      {/* ──── ChatBot ──── */}
      {!showJourneyMap && (
      <ChatBot
        identityId={identity.id}
        identityName={identity.name}
        accentGradient={tc.gradient}
        accentColor={tc.accent}
      />
      )}

      {/* ──── QR Code Modal ──── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(false)} />
          <div className="relative rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl p-8 text-center max-w-sm w-full">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className={`mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br ${tc.gradient} flex items-center justify-center mb-4`}>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">QR Code</h3>
            <p className="text-xs text-zinc-500 mb-6">Scannez pour accéder à cette page</p>

            <div className="flex justify-center mb-6">
              <div className={`rounded-2xl p-4 bg-gradient-to-br ${tc.gradient} bg-opacity-10`}>
                <canvas ref={qrCanvasRef} />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadQR}
                className={`flex-1 rounded-xl bg-gradient-to-r ${tc.gradient} px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Télécharger PNG
                </span>
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-[0.98]"
                title="Copier le lien"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 6.364l4.5 4.5a4.5 4.5 0 006.364-6.364l-1.757-1.757" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
