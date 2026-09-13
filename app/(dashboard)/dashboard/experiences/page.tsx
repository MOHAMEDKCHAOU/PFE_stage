import Link from "next/link";

const cards = [
  { title: "Guided Experience", body: "Ask visitors what they need, reveal the right proof, and guide them to one clear action.", href: "/dashboard/capsules", action: "Manage guided experiences" },
  { title: "360 Smart Space", body: "Scan a real space by simply following the camera guide. Faymoos captures, reconstructs and makes it interactive.", href: "/dashboard/spaces", action: "Open Smart Spaces" },
];

export default function ExperiencesPage() {
  return <div className="space-y-8">
    <div><p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Experiences</p><h1 className="mt-2 text-3xl font-semibold">Guide attention into action.</h1><p className="mt-2 max-w-2xl text-sm text-white/50">Choose the experience type. The complexity stays behind the scenes, where it belongs.</p></div>
    <div className="grid gap-5 md:grid-cols-2">{cards.map((card) => <Link key={card.title} href={card.href} className="group rounded-3xl border border-white/10 bg-white/[.035] p-7 transition hover:border-[#C6A15B]/45 hover:bg-white/[.055]"><div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl border border-[#C6A15B]/30 bg-[#C6A15B]/10 text-xl text-[#C6A15B]">✦</div><h2 className="text-xl font-semibold">{card.title}</h2><p className="mt-3 min-h-16 text-sm leading-6 text-white/50">{card.body}</p><span className="mt-7 inline-flex text-sm font-semibold text-[#C6A15B]">{card.action} →</span></Link>)}</div>
    <div className="rounded-3xl border border-white/10 bg-[#F7F4EE] p-7 text-[#0B0D10]"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#8C6F36]">Simple mental model</p><div className="mt-4 grid gap-3 sm:grid-cols-5"><span>1. Presence</span><span>2. Proof</span><span>3. Experience</span><span>4. Lead</span><span>5. Improve</span></div></div>
  </div>;
}
