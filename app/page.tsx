import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "Multi-Identités",
    desc: "Freelancer, agence, créateur, startup — gérez plusieurs profils professionnels depuis un seul compte.",
    color: "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: "Capsules Interactives",
    desc: "Créez des expériences conversationnelles où vos visiteurs choisissent leur propre parcours.",
    color: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Analytics en Temps Réel",
    desc: "Suivez chaque interaction — clics, parcours choisis, taux de conversion — pour optimiser vos capsules.",
    color: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
    title: "Portfolio Intégré",
    desc: "Présentez vos projets, témoignages clients et réalisations directement dans votre capsule.",
    color: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    iconBg: "bg-amber-100 text-amber-600",
  },
];

const steps = [
  {
    num: "01",
    title: "Créez votre identité",
    desc: "Choisissez votre type de profil, ajoutez votre photo, votre bio et votre headline.",
    icon: "👤",
  },
  {
    num: "02",
    title: "Construisez votre capsule",
    desc: "Définissez des options interactives et des branches avec des CTAs personnalisés.",
    icon: "💊",
  },
  {
    num: "03",
    title: "Partagez votre lien",
    desc: "Un lien unique faymoos.com/capsule/votre-nom — partagez-le partout.",
    icon: "🔗",
  },
];

const profileTypes = [
  { icon: "💼", label: "Freelancer", color: "from-blue-500 to-blue-400" },
  { icon: "🏢", label: "Agence", color: "from-violet-500 to-purple-400" },
  { icon: "🎨", label: "Créateur", color: "from-rose-500 to-pink-400" },
  { icon: "🚀", label: "Startup", color: "from-emerald-500 to-teal-400" },
];

export default async function Home() {
  // Fetch public capsules with their identities
  const capsules = await prisma.capsule.findMany({
    where: {
      options: { some: { branch: { isNot: null } } },
    },
    include: {
      identity: { select: { name: true, slug: true, headline: true, avatar: true, type: true } },
      options: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-slate-800 overflow-hidden">
      {/* ═══════════ NAVBAR ═══════════ */}
      <Navbar />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-20 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-200/40 blur-[120px] animate-pulse-glow" />
          <div className="absolute top-40 right-1/4 h-[400px] w-[400px] rounded-full bg-fuchsia-200/30 blur-[100px] animate-pulse-glow delay-200" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-orange-200/20 blur-[80px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="animate-slide-up inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-violet-700 font-medium">Nouvelle plateforme</span>
            </div>

            {/* Headline */}
            <h1 className="mt-8 max-w-4xl text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] animate-slide-up delay-100 text-slate-900">
              Créez votre{" "}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent animate-gradient-x">
                identité unique
              </span>
              <br />
              en une capsule
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-2xl text-lg sm:text-xl text-slate-500 leading-relaxed animate-slide-up delay-200">
              Faymoos transforme votre présence professionnelle en une expérience interactive.
              Vos visiteurs choisissent leur parcours, vous convertissez plus.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-slide-up delay-300">
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-400 hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.5)] active:scale-[0.98]"
              >
                Commencer gratuitement
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-medium text-slate-600 transition-all hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 shadow-sm"
              >
                <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                </svg>
                Voir comment ça marche
              </a>
            </div>

            {/* Floating capsule mockup */}
            <div className="relative mt-20 w-full max-w-3xl animate-slide-up delay-500">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-300/30 via-fuchsia-300/30 to-orange-300/30 blur-2xl opacity-60" />
              <div className="relative rounded-2xl border border-violet-100 bg-white shadow-2xl shadow-violet-500/10 overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-1.5 text-xs text-slate-400 font-mono border border-slate-200">
                      <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      faymoos.com/capsule/sarah-dev
                    </div>
                  </div>
                </div>
                {/* Capsule content mock */}
                <div className="p-8 sm:p-10">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-3xl font-bold text-white ring-4 ring-violet-100 animate-float-slow">
                      S
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl font-bold text-slate-800">Sarah Dupont</h3>
                      <p className="text-sm text-slate-500 mt-1">Développeuse Full-Stack &amp; UI Designer</p>
                      <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 ring-1 ring-blue-200">💼 Freelancer</span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-200">✅ Disponible</span>
                      </div>
                    </div>
                  </div>
                  {/* Interactive options mock */}
                  <div className="mt-8">
                    <p className="text-sm font-medium text-slate-600 mb-4">Que souhaitez-vous découvrir ?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {["🎯 Voir mes projets", "💬 Lire les témoignages", "📩 Me contacter", "📊 Mon parcours"].map((opt, i) => (
                        <div
                          key={opt}
                          className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                            i === 0
                              ? "border-violet-300 bg-violet-50 text-violet-700 shadow-md shadow-violet-500/10"
                              : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:bg-violet-50/50 hover:text-slate-700"
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUSTED BY (scrolling logos) ═══════════ */}
      <section className="border-y border-violet-100/60 py-12 bg-white/60">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-8">
            Conçu pour tous les professionnels
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {profileTypes.map((pt) => (
              <div key={pt.label} className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${pt.color} text-lg text-white shadow-sm`}>
                  {pt.icon}
                </div>
                <span className="text-sm font-medium text-slate-500">{pt.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-fuchsia-100/40 blur-[150px]" />
        <div className="relative mx-auto max-w-7xl px-6">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm mb-6 shadow-sm">
              <span className="text-violet-600 font-medium">Fonctionnalités</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Tout ce qu&apos;il vous faut pour{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">briller</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Une suite complète d&apos;outils pour créer, gérer et analyser votre présence professionnelle.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group relative rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${f.color}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.iconBg} mb-4 transition-transform group-hover:scale-110`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="relative py-24 sm:py-32 border-t border-violet-100/60">
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-violet-100/30 blur-[150px]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm mb-6 shadow-sm">
              <span className="text-orange-600 font-medium">3 étapes simples</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Comment{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">ça marche</span>
              {" "}?
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              De la création à la conversion, en seulement trois étapes.
            </p>
          </div>

          {/* Steps */}
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.num} className="relative group">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-14 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-gradient-to-r from-violet-300 to-transparent" />
                )}
                <div className="relative flex flex-col items-center text-center">
                  {/* Number + icon */}
                  <div className="relative mb-6">
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-violet-100 bg-white transition-all duration-300 group-hover:border-violet-200 group-hover:bg-violet-50 group-hover:shadow-xl group-hover:shadow-violet-500/10 shadow-sm">
                      <span className="text-5xl">{step.icon}</span>
                    </div>
                    <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-bold text-white ring-4 ring-[#FFFBF5] shadow-md">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PROFILES SHOWCASE ═══════════ */}
      <section id="profiles" className="relative py-24 sm:py-32 border-t border-violet-100/60">
        <div className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-fuchsia-100/30 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-sm mb-6 shadow-sm">
                <span className="text-rose-600 font-medium">Pour chaque profil</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-slate-900">
                Un espace adapté à{" "}
                <span className="bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">chaque métier</span>
              </h2>
              <p className="mt-4 text-lg text-slate-500 leading-relaxed">
                Que vous soyez freelancer, dirigeant d&apos;agence, créateur de contenu ou fondateur de startup,
                Faymoos s&apos;adapte à votre façon de travailler.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { emoji: "✨", text: "Design personnalisable par identité" },
                  { emoji: "🔀", text: "Capsules interactives avec branches" },
                  { emoji: "📈", text: "Analytics par capsule et visiteur" },
                  { emoji: "🎯", text: "CTAs optimisés pour la conversion" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-sm border border-violet-100">{item.emoji}</span>
                    <span className="text-sm text-slate-600">{item.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-400 hover:shadow-xl active:scale-[0.98]"
              >
                Créer mon profil
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Right - profile cards stack */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-200/30 to-fuchsia-200/30 blur-2xl" />
              <div className="relative space-y-4">
                {[
                  { name: "Sarah Dupont", headline: "Développeuse Full-Stack", type: "💼 Freelancer", color: "border-blue-200 hover:shadow-blue-500/10", avatar: "S" },
                  { name: "Studio Pixel", headline: "Agence Digitale Créative", type: "🏢 Agence", color: "border-violet-200 hover:shadow-violet-500/10", avatar: "P" },
                  { name: "Yassine K.", headline: "YouTuber & Entrepreneur", type: "🎨 Créateur", color: "border-rose-200 hover:shadow-rose-500/10", avatar: "Y" },
                ].map((card, i) => (
                  <div
                    key={card.name}
                    className={`relative flex items-center gap-4 rounded-2xl border bg-white p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] shadow-sm ${card.color}`}
                    style={{ transform: `translateX(${i * 20}px)` }}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xl font-bold text-white">
                      {card.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{card.name}</p>
                      <p className="text-sm text-slate-400 truncate">{card.headline}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-600 ring-1 ring-violet-200 font-medium">
                      {card.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="border-y border-violet-100/60 py-16 bg-white/60">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "∞", label: "Identités possibles" },
              { value: "100%", label: "Interactif" },
              { value: "0€", label: "Pour commencer" },
              { value: "24/7", label: "Disponible" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ DISCOVER CAPSULES ═══════════ */}
      {capsules.length > 0 && (
        <section id="discover" className="relative py-24 sm:py-32 border-t border-violet-100/60">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-violet-100/30 blur-[120px]" />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm mb-6 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-violet-600 font-medium">En ligne maintenant</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Découvrez des{" "}
                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                  capsules en action
                </span>
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                Explorez les capsules créées par nos utilisateurs et voyez l&apos;expérience interactive en direct.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {capsules.map((capsule) => (
                <Link
                  key={capsule.id}
                  href={`/capsule/${capsule.identity.slug}`}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/10 hover:scale-[1.02]"
                >
                  {/* Identity header */}
                  <div className="flex items-center gap-3 mb-4">
                    {capsule.identity.avatar ? (
                      <img
                        src={capsule.identity.avatar}
                        alt={capsule.identity.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-100"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white ring-2 ring-violet-100">
                        {capsule.identity.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {capsule.identity.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {capsule.identity.headline || capsule.identity.type}
                      </p>
                    </div>
                  </div>

                  {/* Capsule info */}
                  <h3 className="text-base font-semibold text-slate-800 mb-1 group-hover:text-violet-700 transition-colors">
                    {capsule.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {capsule.objective}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                      {capsule.options.length} option{capsule.options.length !== 1 ? "s" : ""}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-600 ring-1 ring-violet-200 group-hover:bg-violet-100 transition-colors">
                      Interagir
                      <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/50 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-violet-200/30 blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-slate-900">
            Prêt à créer votre{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent animate-gradient-x">
              capsule unique
            </span>
            {" "}?
          </h2>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto">
            Rejoignez Faymoos et transformez votre identité professionnelle en une expérience
            interactive qui convertit vos visiteurs en opportunités.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-10 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-400 hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.5)] active:scale-[0.98]"
            >
              Créer mon compte gratuitement
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-600 transition-colors"
            >
              Déjà un compte ? Se connecter
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-violet-100/60 py-12 bg-white/60">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-black text-white shadow-sm">
                F
              </div>
              <span className="text-sm font-semibold text-slate-400">
                Fay<span className="text-slate-600">moos</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#features" className="hover:text-violet-600 transition-colors">Fonctionnalités</a>
              <a href="#how-it-works" className="hover:text-violet-600 transition-colors">Comment ça marche</a>
              <Link href="/login" className="hover:text-violet-600 transition-colors">Connexion</Link>
              <Link href="/register" className="hover:text-violet-600 transition-colors">Inscription</Link>
            </div>
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Faymoos. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
