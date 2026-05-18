import Image from "next/image";
import Link from "next/link";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { Navbar } from "@/components/Navbar";
import { WelcomeToFaymoos } from "@/components/WelcomeToFaymoos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "Multi-Identités",
    desc: "Freelancer, agence, créateur, startup — gérez plusieurs profils professionnels depuis un seul compte.",
    color: "border-white/10 bg-zinc-900/55 shadow-sm hover:shadow-md hover:border-bordeaux-200/60",
    iconBg: "bg-bordeaux-100 text-bordeaux-800",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: "Capsules Interactives",
    desc: "Créez des expériences conversationnelles où vos visiteurs choisissent leur propre parcours.",
    color: "border-white/10 bg-zinc-900/55 shadow-sm hover:shadow-md hover:border-rose-200/80",
    iconBg: "bg-rose-100 text-rose-800",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Analytics en Temps Réel",
    desc: "Suivez chaque interaction — clics, parcours choisis, taux de conversion — pour optimiser vos capsules.",
    color: "border-white/10 bg-zinc-900/55 shadow-sm hover:shadow-md hover:border-emerald-200/80",
    iconBg: "bg-emerald-100 text-emerald-800",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
    title: "Portfolio Intégré",
    desc: "Présentez vos projets, témoignages clients et réalisations directement dans votre capsule.",
    color: "border-white/10 bg-zinc-900/55 shadow-sm hover:shadow-md hover:border-amber-200/80",
    iconBg: "bg-amber-100 text-amber-800",
  },
];

const profileTypes = [
  { icon: "💼", label: "Freelancer", color: "from-zinc-600 to-bordeaux-500" },
  { icon: "🏢", label: "Agence", color: "from-bordeaux-800 to-bordeaux-500" },
  { icon: "🎨", label: "Créateur", color: "from-rose-700 to-bordeaux-400" },
  { icon: "🚀", label: "Startup", color: "from-emerald-800 to-emerald-500" },
];

export default async function Home() {
  // Fetch public capsules with their identities
  const capsules = await prisma.capsule.findMany({
    where: {
      isPublished: true,
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
    <>
      <WelcomeToFaymoos />
      <div className="relative z-10 min-h-screen overflow-hidden bg-background text-foreground">
      {/* ═══════════ NAVBAR ═══════════ */}
      <Navbar />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Photo de fond (public/background1.jpg) — cover + overlays pour lisibilité */}
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/background1.jpg"
            alt=""
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-[center_22%] sm:object-center"
          />
          {/* Assombrit les bords + base pour le texte */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,transparent_0%,rgba(3,2,10,0.55)_55%,rgba(5,3,10,0.92)_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#030208]/80 via-[#05030a]/50 to-[#05030a]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#05030a] via-transparent to-[#0a0614]/90"
            aria-hidden
          />
          {/* Reflets violets légers (lisibilité + cohérence marque) */}
          <div className="absolute -left-32 top-1/4 h-[min(80vw,520px)] w-[min(80vw,520px)] rounded-full bg-violet-600/10 blur-[100px]" />
          <div className="absolute -right-24 bottom-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-600/8 blur-[90px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="animate-slide-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-1.5 text-sm shadow-lg shadow-black/20 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)] animate-pulse" />
              <span className="font-medium text-violet-100/95">Nouvelle plateforme</span>
            </div>

            {/* Headline */}
            <h1 className="mt-8 max-w-4xl text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] animate-slide-up delay-100 text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)] [text-shadow:0_2px_40px_rgba(0,0,0,0.35)]">
              Créez votre{" "}
              <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-300 bg-clip-text text-transparent animate-gradient-x">
                identité unique
              </span>
              <br />
              <span className="text-white">en une capsule</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-2xl text-lg sm:text-xl text-zinc-200/95 leading-relaxed animate-slide-up delay-200 [text-shadow:0_1px_16px_rgba(0,0,0,0.5)]">
              Faymoos transforme votre présence professionnelle en une expérience interactive.
              Vos visiteurs choisissent leur parcours, vous convertissez plus.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-slide-up delay-300">
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-900/40 ring-1 ring-white/15 transition-all hover:from-violet-600 hover:to-fuchsia-500 hover:shadow-[0_20px_50px_-12px_rgba(139,92,246,0.55)] active:scale-[0.98]"
              >
                Commencer gratuitement
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-base font-medium text-white backdrop-blur-md transition-all hover:border-white/35 hover:bg-white/15 shadow-lg shadow-black/20"
              >
                <svg className="h-5 w-5 text-violet-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                </svg>
                Voir comment ça marche
              </a>
            </div>

            {/* Floating capsule mockup */}
            {/* Aperçu capsule = zone noire (comme l&apos;expérience réelle) */}
            <div className="relative mt-20 w-full max-w-3xl animate-slide-up delay-500">
              <div className="absolute -inset-4 rounded-3xl bg-zinc-950/40 blur-2xl" />
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30 overflow-hidden ring-2 ring-stone-900/10">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-3 bg-zinc-950/80">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 rounded-lg bg-zinc-900/90 px-4 py-1.5 text-xs text-zinc-500 font-mono border border-zinc-800">
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
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bordeaux-800 to-bordeaux-500 text-3xl font-bold text-white ring-4 ring-bordeaux-500/25 animate-float-slow">
                      S
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl font-bold text-zinc-100">Sarah Dupont</h3>
                      <p className="text-sm text-zinc-400 mt-1">Développeuse Full-Stack &amp; UI Designer</p>
                      <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                        <span className="rounded-full bg-bordeaux-500/10 px-3 py-1 text-xs font-medium text-bordeaux-300 ring-1 ring-bordeaux-500/30">💼 Freelancer</span>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">✅ Disponible</span>
                      </div>
                    </div>
                  </div>
                  {/* Interactive options mock */}
                  <div className="mt-8">
                    <p className="text-sm font-medium text-zinc-300 mb-4">Que souhaitez-vous découvrir ?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {["🎯 Voir mes projets", "💬 Lire les témoignages", "📩 Me contacter", "📊 Mon parcours"].map((opt, i) => (
                        <div
                          key={opt}
                          className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                            i === 0
                              ? "border-bordeaux-500/40 bg-bordeaux-500/10 text-bordeaux-200 shadow-md shadow-bordeaux-500/20"
                              : "border-zinc-700/80 bg-zinc-900/30 text-zinc-400 hover:border-bordeaux-500/30 hover:bg-bordeaux-500/5 hover:text-zinc-200"
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
      <section className="border-y border-white/10 bg-zinc-950/80 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-8">
            Conçu pour tous les professionnels
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {profileTypes.map((pt) => (
              <div key={pt.label} className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${pt.color} text-lg text-white shadow-sm`}>
                  {pt.icon}
                </div>
                <span className="text-sm font-medium text-zinc-300">{pt.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-bordeaux-200/20 blur-[150px] animate-mesh" />
        <div className="relative mx-auto max-w-7xl px-6">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-bordeaux-200/80 bg-zinc-900/45 px-4 py-1.5 text-sm mb-6 shadow-sm">
              <span className="text-bordeaux-800 font-medium">Fonctionnalités</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Tout ce qu&apos;il vous faut pour{" "}
              <span className="bg-gradient-to-r from-bordeaux-800 to-bordeaux-500 bg-clip-text text-transparent">briller</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
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
                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS (interactive) ═══════════ */}
      <HowItWorksSection />

      {/* ═══════════ PROFILES SHOWCASE ═══════════ */}
      <section id="profiles" className="relative py-24 sm:py-32 border-t border-white/10">
        <div className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-rose-100/30 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-rose-50/90 px-4 py-1.5 text-sm mb-6 shadow-sm">
                <span className="text-rose-800 font-medium">Pour chaque profil</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-foreground">
                Un espace adapté à{" "}
                <span className="bg-gradient-to-r from-rose-600 to-bordeaux-700 bg-clip-text text-transparent">chaque métier</span>
              </h2>
              <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
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
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bordeaux-100 text-sm border border-bordeaux-200">{item.emoji}</span>
                    <span className="text-sm text-zinc-300">{item.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-bordeaux-800 to-bordeaux-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-bordeaux-500/25 transition-all hover:from-bordeaux-600 hover:to-bordeaux-400 hover:shadow-xl active:scale-[0.98]"
              >
                Créer mon profil
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Right - profile cards stack */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-bordeaux-100/30 to-rose-100/20 blur-2xl" />
              <div className="relative space-y-4">
                {[
                  { name: "Sarah Dupont", headline: "Développeuse Full-Stack", type: "💼 Freelancer", color: "border-white/10 hover:shadow-bordeaux-200/30", avatar: "S" },
                  { name: "Studio Pixel", headline: "Agence Digitale Créative", type: "🏢 Agence", color: "border-white/10 hover:shadow-bordeaux-200/30", avatar: "P" },
                  { name: "Yassine K.", headline: "YouTuber & Entrepreneur", type: "🎨 Créateur", color: "border-white/10 hover:shadow-rose-200/40", avatar: "Y" },
                ].map((card, i) => (
                  <div
                    key={card.name}
                    className={`relative flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/55 p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${card.color}`}
                    style={{ transform: `translateX(${i * 20}px)` }}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bordeaux-800 to-bordeaux-500 text-xl font-bold text-white">
                      {card.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{card.name}</p>
                      <p className="text-sm text-zinc-500 truncate">{card.headline}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-bordeaux-50 px-3 py-1 text-xs text-bordeaux-800 ring-1 ring-bordeaux-200 font-medium">
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
      <section className="border-y border-white/10 py-16 bg-zinc-900/10/60">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "∞", label: "Identités possibles" },
              { value: "100%", label: "Interactif" },
              { value: "0€", label: "Pour commencer" },
              { value: "24/7", label: "Disponible" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-bordeaux-800 to-bordeaux-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ DISCOVER CAPSULES ═══════════ */}
      {capsules.length > 0 && (
        <section id="discover" className="theme-capsule relative border-t border-zinc-800 bg-zinc-950 py-24 sm:py-32 text-zinc-100">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-bordeaux-900/20 blur-[120px]" />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-bordeaux-500/30 bg-bordeaux-500/10 px-4 py-1.5 text-sm mb-6 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-bordeaux-200 font-medium">En ligne maintenant</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50">
                Découvrez des{" "}
                <span className="bg-gradient-to-r from-rose-200 to-bordeaux-300 bg-clip-text text-transparent">
                  capsules en action
                </span>
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Explorez les capsules créées par nos utilisateurs et voyez l&apos;expérience interactive en direct.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {capsules.map((capsule) => (
                <Link
                  key={capsule.id}
                  href={`/capsule/${capsule.identity.slug}`}
                  className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-bordeaux-500/30 hover:shadow-xl hover:shadow-bordeaux-500/20 hover:scale-[1.02]"
                >
                  {/* Identity header */}
                  <div className="flex items-center gap-3 mb-4">
                    {capsule.identity.avatar ? (
                      <img
                        src={capsule.identity.avatar}
                        alt={capsule.identity.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-bordeaux-500/25"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bordeaux-800 to-bordeaux-500 text-sm font-bold text-white ring-2 ring-bordeaux-500/25">
                        {capsule.identity.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-100 truncate">
                        {capsule.identity.name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {capsule.identity.headline || capsule.identity.type}
                      </p>
                    </div>
                  </div>

                  {/* Capsule info */}
                  <h3 className="text-base font-semibold text-zinc-100 mb-1 group-hover:text-bordeaux-200 transition-colors">
                    {capsule.title}
                  </h3>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                    {capsule.objective}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                      {capsule.options.length} option{capsule.options.length !== 1 ? "s" : ""}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-bordeaux-500/10 px-2.5 py-1 text-[11px] font-medium text-bordeaux-300 ring-1 ring-bordeaux-500/30 group-hover:bg-bordeaux-500/15 transition-colors">
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bordeaux-100/20 to-transparent" />
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bordeaux-200/15 blur-[150px] animate-pulse-glow" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-foreground">
            Prêt à créer votre{" "}
            <span className="bg-gradient-to-r from-bordeaux-800 via-bordeaux-600 to-rose-600 bg-clip-text text-transparent animate-gradient-x">
              capsule unique
            </span>
            {" "}?
          </h2>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Rejoignez Faymoos et transformez votre identité professionnelle en une expérience
            interactive qui convertit vos visiteurs en opportunités.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-bordeaux-800 to-bordeaux-500 px-10 py-4 text-base font-semibold text-white shadow-xl shadow-bordeaux-500/25 transition-all hover:from-bordeaux-600 hover:to-bordeaux-400 hover:shadow-[0_20px_60px_-15px_rgba(158,27,50,0.45)] active:scale-[0.98]"
            >
              Créer mon compte gratuitement
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-bordeaux-800 transition-colors"
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
      <footer className="border-t border-white/10 py-12 bg-zinc-900/10/80">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-bordeaux-800 to-bordeaux-500 text-xs font-black text-white shadow-sm">
                F
              </div>
              <span className="text-sm font-semibold text-zinc-400">
                Fay<span className="text-foreground">moos</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <a href="#features" className="hover:text-bordeaux-800 transition-colors">Fonctionnalités</a>
              <a href="#how-it-works" className="hover:text-bordeaux-800 transition-colors">Comment ça marche</a>
              <Link href="/login" className="hover:text-bordeaux-800 transition-colors">Connexion</Link>
              <Link href="/register" className="hover:text-bordeaux-800 transition-colors">Inscription</Link>
            </div>
            <p className="text-xs text-zinc-500">
              &copy; {new Date().getFullYear()} Faymoos. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
