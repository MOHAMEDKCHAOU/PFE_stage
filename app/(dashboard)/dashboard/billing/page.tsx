"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BILLING_PLAN_CATALOG, PLAN_LIMITS, type SubscriptionPlanKey } from "@/lib/subscription-plans";

type BillingSnapshot = {
  effectivePlan: SubscriptionPlanKey;
  declaredPlan: SubscriptionPlanKey;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  limits: (typeof PLAN_LIMITS)[SubscriptionPlanKey];
  usage: {
    periodKey: string;
    identities: number;
    capsules: number;
    studioClients: number;
    studioInvitesThisMonth: number;
    studioExportsThisMonth: number;
  };
};

type CatalogPlanRow = {
  planKey: string;
  name: string;
  description: string | null;
  monthlyCents: number;
  yearlyCents: number;
  currency: string;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(cents / 100);
}

function UsageBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((used / max) * 100));
  const full = max <= 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-stone-600">{label}</span>
        <span className="font-medium tabular-nums text-stone-900">
          {used}
          {!full && ` / ${max}`}
        </span>
      </div>
      {!full && (
        <div className="h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-amber-500" : "bg-bordeaux-600"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");

  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [catalog, setCatalog] = useState<{
    demoMode: boolean;
    plans: CatalogPlanRow[];
  } | null>(null);

  useEffect(() => {
    if (checkout === "success") {
      setBanner({ kind: "ok", text: "Paiement enregistré. Votre abonnement sera mis à jour sous quelques instants." });
    } else if (checkout === "cancel") {
      setBanner({ kind: "err", text: "Paiement annulé. Aucun changement de plan." });
    }
  }, [checkout]);

  async function load() {
    try {
      const res = await fetch("/api/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setRole(data.role ?? null);
      setBilling(data.billing ?? null);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    void fetch("/api/billing/plans")
      .then((r) => r.json())
      .then((data: { demoMode?: boolean; plans?: CatalogPlanRow[] }) => {
        setCatalog({
          demoMode: !!data.demoMode,
          plans: Array.isArray(data.plans) ? data.plans : [],
        });
      })
      .catch(() => setCatalog({ demoMode: false, plans: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function activateDemoPlan(plan: SubscriptionPlanKey, interval: "month" | "year") {
    setCheckoutLoading(`${plan}-${interval}`);
    setBanner(null);
    try {
      const res = await fetch("/api/billing/demo-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({ kind: "err", text: data.error || "Activation démo impossible" });
        return;
      }
      setBanner({ kind: "ok", text: data.message || "Plan mis à jour (démo)." });
      await load();
    } catch {
      setBanner({ kind: "err", text: "Erreur réseau" });
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function startCheckout(plan: SubscriptionPlanKey, interval: "month" | "year") {
    setCheckoutLoading(`${plan}-${interval}`);
    setBanner(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({ kind: "err", text: data.error || "Impossible de démarrer le paiement" });
        return;
      }
      if (data.url) window.location.href = data.url as string;
    } catch {
      setBanner({ kind: "err", text: "Erreur réseau" });
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    setBanner(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setBanner({ kind: "err", text: data.error || "Impossible d’ouvrir le portail" });
        return;
      }
      if (data.url) window.location.href = data.url as string;
    } catch {
      setBanner({ kind: "err", text: "Erreur réseau" });
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading || !billing) {
    return (
      <div className="flex items-center justify-center py-24 text-stone-500">Chargement…</div>
    );
  }

  const isAffiliate = role === "AFFILIATE";
  const statusLabel = billing.subscriptionStatus
    ? billing.subscriptionStatus.replace(/_/g, " ")
    : "—";
  const periodEnd = billing.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const paidCatalog = BILLING_PLAN_CATALOG.filter((p) => p.key !== "FREE");
  const catalogLoaded = catalog !== null;
  const demoMode = catalog?.demoMode ?? false;

  function rowFor(planKey: SubscriptionPlanKey) {
    return catalog?.plans.find((r) => r.planKey === planKey);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Facturation</h1>
        <p className="mt-1 text-stone-600">
          {!catalogLoaded
            ? "Chargement des offres…"
            : demoMode
              ? "Mode démonstration (PFE) : tarifs issus de la base de données, abonnement simulé sans paiement Stripe."
              : "Plans Faymoos et usage. Les tarifs affichés viennent du catalogue en base ; le paiement réel passe par Stripe."}
        </p>
      </div>

      {catalogLoaded && demoMode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Projet universitaire : activez un plan avec les boutons ci-dessous pour tester les quotas. Aucun paiement n’est effectué.
        </div>
      )}

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {banner.text}
        </div>
      )}

      <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm shadow-stone-200/40">
        <h2 className="text-lg font-semibold text-stone-900">Votre abonnement</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Plan effectif</dt>
            <dd className="mt-0.5 text-lg font-semibold text-stone-900">
              {BILLING_PLAN_CATALOG.find((p) => p.key === billing.effectivePlan)?.name ?? billing.effectivePlan}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {demoMode ? "Statut (démo)" : "Statut Stripe"}
            </dt>
            <dd className="mt-0.5 font-medium capitalize text-stone-800">{statusLabel}</dd>
          </div>
          {periodEnd && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Fin de période</dt>
              <dd className="mt-0.5 font-medium text-stone-800">{periodEnd}</dd>
            </div>
          )}
        </dl>

        {!demoMode && billing.hasStripeCustomer && (
          <button
            type="button"
            onClick={() => void openPortal()}
            disabled={portalLoading}
            className="mt-6 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {portalLoading ? "Ouverture…" : "Gérer l’abonnement (Stripe)"}
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm shadow-stone-200/40">
        <h2 className="text-lg font-semibold text-stone-900">Usage ({billing.usage.periodKey}, UTC)</h2>
        <div className="mt-6 space-y-5 max-w-lg">
          <UsageBar label="Identités" used={billing.usage.identities} max={billing.limits.maxIdentities} />
          <UsageBar label="Capsules" used={billing.usage.capsules} max={billing.limits.maxCapsules} />
          {isAffiliate && billing.limits.studioFeatureAccess && (
            <>
              <UsageBar label="Clients Studio" used={billing.usage.studioClients} max={billing.limits.maxStudioClients} />
              <UsageBar
                label="Invitations ce mois"
                used={billing.usage.studioInvitesThisMonth}
                max={billing.limits.maxStudioInvitesPerMonth}
              />
              <UsageBar
                label="Exports Studio ce mois"
                used={billing.usage.studioExportsThisMonth}
                max={billing.limits.maxStudioExportsPerMonth}
              />
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-900">Choisir un plan</h2>
        <p className="mt-1 text-sm text-stone-600">
          {!catalogLoaded
            ? "Chargement du catalogue tarifaire…"
            : demoMode
            ? "Montants enregistrés en base (table SubscriptionPlanPrice). Choisissez une période pour mettre à jour votre compte en mode démo."
            : "Checkout Stripe pour souscrire. Les montants affichés sont ceux du catalogue base (référence) ; le prix facturé est celui du prix Stripe configuré."}
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {paidCatalog.map((plan) => {
            const lim = PLAN_LIMITS[plan.key];
            const isCurrent = billing.effectivePlan === plan.key;
            const dbRow = rowFor(plan.key);
            return (
              <div
                key={plan.key}
                className={`flex flex-col rounded-2xl border p-5 shadow-sm ${
                  plan.highlight ? "border-bordeaux-300 bg-bordeaux-50/40 ring-1 ring-bordeaux-200/60" : "border-stone-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-stone-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Actuel
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-stone-600">{dbRow?.description ?? plan.description}</p>
                {dbRow && (
                  <p className="mt-2 text-sm font-semibold text-stone-800">
                    {formatMoney(dbRow.monthlyCents, dbRow.currency)} <span className="font-normal text-stone-500">/ mois</span>
                    <span className="mx-1 text-stone-400">·</span>
                    {formatMoney(dbRow.yearlyCents, dbRow.currency)} <span className="font-normal text-stone-500">/ an</span>
                  </p>
                )}
                <ul className="mt-4 space-y-1 text-xs text-stone-600">
                  <li>Jusqu’à {lim.maxIdentities} identités</li>
                  <li>Jusqu’à {lim.maxCapsules} capsules</li>
                  {lim.studioFeatureAccess ? (
                    <>
                      <li>Studio : {lim.maxStudioClients} clients, {lim.maxStudioInvitesPerMonth} invitations / mois</li>
                      <li>{lim.maxStudioExportsPerMonth} exports / mois</li>
                    </>
                  ) : (
                    <li>Pas d’espace Studio client</li>
                  )}
                </ul>
                <div className="mt-auto flex flex-col gap-2 pt-6">
                  <button
                    type="button"
                    disabled={!!checkoutLoading || isCurrent || !catalogLoaded}
                    onClick={() =>
                      void (demoMode ? activateDemoPlan(plan.key, "month") : startCheckout(plan.key, "month"))
                    }
                    className="w-full rounded-xl bg-bordeaux-700 py-2.5 text-sm font-medium text-white transition hover:bg-bordeaux-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {!catalogLoaded
                      ? "Chargement…"
                      : checkoutLoading === `${plan.key}-month`
                        ? demoMode
                          ? "…"
                          : "Redirection…"
                        : isCurrent
                          ? "Déjà sur ce plan"
                          : demoMode
                            ? "Activer — mensuel (démo)"
                            : "Mensuel — Stripe"}
                  </button>
                  <button
                    type="button"
                    disabled={!!checkoutLoading || isCurrent || !catalogLoaded}
                    onClick={() =>
                      void (demoMode ? activateDemoPlan(plan.key, "year") : startCheckout(plan.key, "year"))
                    }
                    className="w-full rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {!catalogLoaded
                      ? "Chargement…"
                      : checkoutLoading === `${plan.key}-year`
                        ? demoMode
                          ? "…"
                          : "Redirection…"
                        : demoMode
                          ? "Activer — annuel (démo)"
                          : "Annuel — Stripe"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-stone-500">Chargement…</div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
