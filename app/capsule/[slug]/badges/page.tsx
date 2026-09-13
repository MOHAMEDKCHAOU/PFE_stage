import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPublicBadgePayloadForUser } from "@/lib/faymoos-badges";
import { notFound } from "next/navigation";
import type { PublicBadgeDTO } from "@/lib/faymoos-badges";

export const dynamic = "force-dynamic";

const CAT: Record<string, string> = {
  EXPERTISE: "Expertise",
  CREDIBILITY: "Crédibilité",
  IMPACT: "Impact",
};

const catStyle: Record<string, string> = {
  EXPERTISE: "border-[#C6A15B]/30 bg-[#C6A15B]/10",
  CREDIBILITY: "border-[#C6A15B]/30 bg-[#C6A15B]/10",
  IMPACT: "border-[#C6A15B]/30 bg-[#C6A15B]/10",
};

function groupByCategory(items: PublicBadgeDTO[]): [string, PublicBadgeDTO[]][] {
  const order = ["EXPERTISE", "CREDIBILITY", "IMPACT"];
  const map = new Map<string, PublicBadgeDTO[]>();
  for (const b of items) {
    const arr = map.get(b.category) ?? [];
    arr.push(b);
    map.set(b.category, arr);
  }
  return order.filter((k) => map.has(k)).map((k) => [k, map.get(k)!]);
}

type PageProps = { params: Promise<{ slug: string }> };

export default async function IdentityBadgesPage({ params }: PageProps) {
  const { slug } = await params;
  const identity = await prisma.identityProfile.findUnique({
    where: { slug },
    select: { name: true, userId: true },
  });
  if (!identity) notFound();

  let bundle: Awaited<ReturnType<typeof getPublicBadgePayloadForUser>>;
  try {
    bundle = await getPublicBadgePayloadForUser(identity.userId);
  } catch {
    notFound();
  }

  const grouped = groupByCategory(bundle.all);

  return (
    <main className="theme-capsule min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href={`/capsule/${slug}`}
          className="text-sm text-[#C6A15B] hover:text-[#C6A15B] transition-colors"
        >
          ← Retour au profil
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Badges — {identity.name}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Score Faymoos : <span className="text-white font-semibold">{bundle.score}</span> / 100 —{" "}
          {bundle.scoreLabel}
        </p>

        <div className="mt-10 space-y-10">
          {grouped.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucun badge validé pour l’instant.</p>
          ) : (
            grouped.map(([cat, items]) => (
              <section key={cat}>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">
                  {CAT[cat] ?? cat}
                </h2>
                <ul className="space-y-3">
                  {items.map((b) => (
                    <li
                      key={b.id}
                      className={`rounded-2xl border p-4 ${catStyle[b.category] ?? catStyle.EXPERTISE}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white flex items-center gap-2">
                            <span>{b.tier === "EXPERT" ? "⭐" : "✔"}</span> {b.label}
                          </p>
                          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{b.description}</p>
                          {b.evidence && (
                            <p className="mt-2 text-xs text-zinc-500 italic">{b.evidence}</p>
                          )}
                        </div>
                        <time
                          className="shrink-0 text-[10px] text-zinc-500 whitespace-nowrap"
                          dateTime={b.verifiedAt}
                        >
                          {new Date(b.verifiedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
