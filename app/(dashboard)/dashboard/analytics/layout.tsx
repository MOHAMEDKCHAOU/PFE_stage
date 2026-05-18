export default function DashboardAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="analytics-route-shell relative isolate min-h-[min(88vh,940px)] overflow-hidden rounded-3xl border border-white/[0.09] shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_24px_80px_-20px_rgba(0,0,0,0.55)]">
      {/* Voile lisibilité — l’image est sur .analytics-route-shell (voir globals.css) */}
      <div className="analytics-photo-scrim pointer-events-none absolute inset-0 z-0" aria-hidden />
      <div className="relative z-[1] px-3 py-5 sm:px-5 sm:py-6">{children}</div>
    </div>
  );
}