import Link from "next/link";
import { Navbar } from "@/components/Navbar";

const capabilityRows = [
  ["01", "Identity", "Create multiple professional identities with a public profile, portfolio, links and social proof."],
  ["02", "Capsules", "Turn visitor intent into a guided decision flow with branches, proof blocks and one clear CTA."],
  ["03", "Intelligence", "Use AI to draft bios, headlines, project summaries, capsule structures and contextual CTAs."],
  ["04", "Analytics", "See sessions, completion, decision time, drop-off and branch performance without analytics clutter."],
];

const workflow = [
  ["Define", "Create an identity and tell Faymoos what you do."],
  ["Prove", "Add projects, testimonials, links and reusable media."],
  ["Guide", "Build a capsule that adapts to each visitor's intent."],
  ["Learn", "Use analytics and AI insights to improve the next visit."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0D10] text-[#F7F4EE]">
      <Navbar />
      <section className="mx-auto grid min-h-[760px] max-w-[1320px] items-center gap-14 px-6 pb-20 pt-32 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C6A15B]/30 bg-[#C6A15B]/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C6A15B]">Digital identity, made useful</div>
          <h1 className="max-w-[760px] text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">One place to show who you are, prove your value and guide the next action.</h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">Faymoos combines multi-identity profiles, portfolios, social proof, decision capsules, analytics and AI in one calm workspace. No rainbow dashboard. No mystery buttons. Human civilization survives another interface.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register" className="fay-button-primary px-5 py-3 text-sm">Create your space <span aria-hidden>→</span></Link>
            <Link href="/explore" className="fay-button-secondary px-5 py-3 text-sm">Explore public spaces</Link>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-3 gap-5 border-t border-white/10 pt-6">
            <div><p className="text-2xl font-semibold">1</p><p className="mt-1 text-xs text-white/40">Workspace</p></div>
            <div><p className="text-2xl font-semibold">∞</p><p className="mt-1 text-xs text-white/40">Identity angles</p></div>
            <div><p className="text-2xl font-semibold">1 CTA</p><p className="mt-1 text-xs text-white/40">Per visitor path</p></div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 rounded-full bg-[#C6A15B]/[0.08] blur-3xl" />
          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0B0D10]/[0.035] p-4 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 px-2 pb-4"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#C6A15B]" /><span className="text-xs font-medium text-white/65">Live workspace</span></div><span className="text-[10px] uppercase tracking-[.18em] text-white/30">Faymoos / Alex</span></div>
            <div className="grid gap-3 pt-4 sm:grid-cols-[.85fr_1.15fr]">
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-[#0B0D10] p-4"><p className="fay-label">Identity</p><div className="mt-8"><div className="mb-4 h-11 w-11 rounded-full bg-[#C6A15B]/20" /><p className="font-semibold">Alex Morgan</p><p className="mt-1 text-xs text-white/42">Digital artist & creator</p></div></div>
                <div className="rounded-2xl border border-white/10 bg-[#0B0D10] p-4"><div className="flex items-end justify-between"><div><p className="fay-label">Score</p><p className="mt-3 text-3xl font-semibold">78</p></div><div className="h-12 w-12 rounded-full border-[5px] border-[#C6A15B] border-r-white/10" /></div></div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0B0D10] p-5">
                <div className="flex items-center justify-between"><div><p className="fay-label">Capsule</p><h3 className="mt-2 font-semibold">How can I help you?</h3></div><span className="rounded-full border border-[#C6A15B]/35 px-2 py-1 text-[10px] text-[#C6A15B]">Published</span></div>
                <div className="mt-8 space-y-2.5">{["I need a creative partner", "I want to buy a digital product", "I want to see selected work"].map((x, i) => <div key={x} className={`rounded-xl border p-3 text-sm ${i===0 ? "border-[#C6A15B]/55 bg-[#C6A15B]/10 text-[#F7F4EE]" : "border-white/10 text-white/50"}`}>{x}</div>)}</div>
                <div className="mt-8 border-t border-white/10 pt-5"><div className="mb-2 flex justify-between text-[11px] text-white/35"><span>Completion</span><span>72%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#0B0D10]/10"><div className="h-full w-[72%] rounded-full bg-[#C6A15B]" /></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-[#0B0D10]/[0.018]">
        <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10"><div className="mb-12 max-w-2xl"><p className="fay-label text-[#C6A15B]">The product</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Four modules. One clear job each.</h2></div><div className="divide-y divide-white/10 border-y border-white/10">{capabilityRows.map(([n,title,copy]) => <div key={n} className="grid gap-4 py-7 md:grid-cols-[70px_220px_1fr]"><span className="text-xs text-[#C6A15B]">{n}</span><h3 className="font-semibold">{title}</h3><p className="max-w-2xl text-sm leading-6 text-white/45">{copy}</p></div>)}</div></div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10"><div className="mb-12"><p className="fay-label text-[#C6A15B]">Workflow</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">From scattered presence to a guided experience.</h2></div><div className="grid gap-3 md:grid-cols-4">{workflow.map(([title,copy], index) => <div key={title} className="fay-panel p-6"><span className="text-xs font-semibold text-[#C6A15B]">0{index+1}</span><h3 className="mt-12 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/43">{copy}</p></div>)}</div></section>

      <section className="mx-auto max-w-[1320px] px-6 pb-24 lg:px-10"><div className="overflow-hidden rounded-[26px] border border-[#C6A15B]/35 bg-[#C6A15B] p-8 text-[#0B0D10] sm:p-12"><div className="grid items-end gap-8 md:grid-cols-[1fr_auto]"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] opacity-60">Start simple</p><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Create one identity. Publish one useful capsule. Improve from real behavior.</h2></div><Link href="/register" className="rounded-xl bg-[#0B0D10] px-5 py-3 text-sm font-semibold text-[#F7F4EE]">Create account →</Link></div></div></section>

      <footer className="border-t border-white/10"><div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-6 py-8 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between lg:px-10"><span>© 2026 Faymoos</span><span>Identity · Proof · Decision · Insight</span></div></footer>
    </main>
  );
}
