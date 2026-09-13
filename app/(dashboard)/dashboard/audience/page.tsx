import Link from "next/link";
const items = [
  { label: "Analytics", href: "/dashboard/analytics", body: "Understand visits, completion, drop-off and conversion." },
  { label: "Leads", href: "/dashboard/leads", body: "Move contacts from new to qualified, won or lost." },
  { label: "Inbox", href: "/dashboard/inbox", body: "Messages, comments and contact requests in one place." },
  { label: "Feedback", href: "/dashboard/capsule-comments", body: "Review and moderate public feedback." },
];
export default function AudiencePage(){ return <div className="space-y-8"><div><p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Audience</p><h1 className="mt-2 text-3xl font-semibold">Understand people, not charts.</h1><p className="mt-2 text-sm text-white/50">What happened, where visitors stopped, who converted, and what to improve next.</p></div><div className="grid gap-4 md:grid-cols-2">{items.map(i=><Link href={i.href} key={i.label} className="rounded-3xl border border-white/10 bg-white/[.035] p-6 transition hover:border-[#C6A15B]/40"><h2 className="font-semibold">{i.label}</h2><p className="mt-2 text-sm leading-6 text-white/50">{i.body}</p><span className="mt-5 inline-block text-sm text-[#C6A15B]">Open →</span></Link>)}</div></div> }
