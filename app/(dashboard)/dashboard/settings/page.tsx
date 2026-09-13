import Link from "next/link";
const settings=[
  ["Account & presence","/dashboard/identities","Profile information and public presence"],
  ["Security","/dashboard/settings/security","Sessions, access and audit visibility where permitted"],
  ["Notifications","/dashboard/settings/notifications","Notification preferences and activity"],
  ["Plan & billing","/dashboard/billing","Subscription, usage and invoices"],
];
export default function SettingsPage(){return <div className="space-y-8"><div><p className="text-xs uppercase tracking-[.18em] text-[#C6A15B]">Settings</p><h1 className="mt-2 text-3xl font-semibold">Everything administrative, out of your way.</h1></div><div className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[.025]">{settings.map(([t,h,b])=><Link key={t} href={h} className="flex items-center justify-between gap-5 p-6 hover:bg-white/[.035]"><div><h2 className="font-semibold">{t}</h2><p className="mt-1 text-sm text-white/45">{b}</p></div><span className="text-[#C6A15B]">→</span></Link>)}</div></div>}
