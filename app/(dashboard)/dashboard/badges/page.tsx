"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicProfileBadges } from "@/components/PublicProfileBadges";
import type { PublicBadgeBundle } from "@/lib/faymoos-badges";

type IdentityRow = { id: string; name: string; slug: string };

export default function DashboardBadgesPage() {
  const [identities, setIdentities] = useState<IdentityRow[]>([]);
  const [slug, setSlug] = useState("");
  const [bundle, setBundle] = useState<PublicBadgeBundle | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/identity", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d: IdentityRow[]) => {
        const list = Array.isArray(d) ? d : [];
        setIdentities(list);
        if (list[0]) setSlug(list[0].slug);
      })
      .catch(() => setIdentities([]));
  }, []);

  useEffect(() => {
    if (!slug) {
      setBundle(null);
      return;
    }
    setLoadErr(null);
    fetch(`/api/badges/public?identitySlug=${encodeURIComponent(slug)}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(typeof j.error === "string" ? j.error : `Erreur ${r.status}`);
        }
        return r.json() as PublicBadgeBundle;
      })
      .then(setBundle)
      .catch((e: Error) => {
        setLoadErr(e.message);
        setBundle(null);
      });
  }, [slug]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Score & badges</h1>
        <p className="mt-1 text-sm text-stone-600">
          Les badges se mettent à jour automatiquement (profil, liens, capsules). L’équipe peut attribuer{" "}
          <strong className="font-medium text-stone-800">Identité vérifiée</strong> depuis l’admin.
        </p>
      </div>

      {identities.length > 1 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Profil public
          </label>
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-2 w-full max-w-md rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm"
          >
            {identities.map((i) => (
              <option key={i.id} value={i.slug}>
                {i.name} — /{i.slug}
              </option>
            ))}
          </select>
        </div>
      )}

      {loadErr && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {loadErr}
          <p className="mt-1 text-xs text-red-800">
            Si vous venez d’ajouter le module badges : <code className="rounded bg-red-100 px-1">npx prisma migrate deploy</code>
          </p>
        </div>
      )}

      {bundle && slug && (
        <div className="rounded-2xl border border-stone-200 bg-zinc-950 p-1 shadow-sm">
          <PublicProfileBadges identitySlug={slug} bundle={bundle} />
        </div>
      )}

      {slug && (
        <Link
          href={`/capsule/${slug}/badges`}
          className="inline-flex text-sm font-medium text-bordeaux-800 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Voir la page publique « tous les badges » ↗
        </Link>
      )}

      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 p-5 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">Conseils</p>
        <ul className="mt-2 list-disc list-inside space-y-1 text-stone-600">
          <li>Renseignez headline, bio et photo pour « Profil soigné » (Expert avec couverture + portfolio).</li>
          <li>Ajoutez LinkedIn ou GitHub dans les liens sociaux pour « Présence en ligne ».</li>
          <li>Publiez au moins une capsule pour « Créateur actif » (Expert : 3+ capsules ou 50+ sessions).</li>
        </ul>
      </div>
    </div>
  );
}
