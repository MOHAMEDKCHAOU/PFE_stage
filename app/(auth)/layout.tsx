export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-gradient-to-br from-[#C6A15B] via-zinc-950 to-[#0B0D10] p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.12] faymoos-stars" />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#C6A15B]/25 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-[#C6A15B]/15 rounded-full blur-[80px] animate-mesh" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-[#C6A15B]/10 rounded-full blur-[90px] animate-pulse-glow delay-300" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-900/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/10">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight font-[family-name:var(--font-space-grotesk)]">
              Faymoos
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight font-[family-name:var(--font-space-grotesk)]">
              Créez votre
              <br />
              <span className="text-white/90">identité unique</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-sm">
              Capsules interactives, portfolio dynamique et analytics — tout en
              un seul endroit.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              {
                icon: "✦",
                title: "Capsules Interactives",
                desc: "Présentez vos projets avec des parcours personnalisés",
              },
              {
                icon: "◈",
                title: "Multi-Identités",
                desc: "Gérez plusieurs profils professionnels",
              },
              {
                icon: "▣",
                title: "Analytics Intégrés",
                desc: "Suivez l'engagement de vos visiteurs en temps réel",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/10 backdrop-blur-sm border border-white/15 text-white text-sm">
                  {feature.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="text-sm text-white/60">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-white/40">
            © 2026 Faymoos. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
