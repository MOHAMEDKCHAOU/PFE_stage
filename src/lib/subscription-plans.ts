/** Plans Faymoos (alignés Stripe Products / Prices). */
export const SUBSCRIPTION_PLANS = ["FREE", "PRO", "STUDIO", "STUDIO_PLUS"] as const;
export type SubscriptionPlanKey = (typeof SUBSCRIPTION_PLANS)[number];

export type PlanLimits = {
  maxIdentities: number;
  maxCapsules: number;
  /** Clients Studio liés (affilié) */
  maxStudioClients: number;
  /** Invitations Studio créées par mois calendaire UTC */
  maxStudioInvitesPerMonth: number;
  /** Exports CSV/PDF Studio par mois UTC */
  maxStudioExportsPerMonth: number;
  /** Accès routes Studio (en plus du rôle AFFILIATE) */
  studioFeatureAccess: boolean;
};

export const PLAN_LIMITS: Record<SubscriptionPlanKey, PlanLimits> = {
  FREE: {
    maxIdentities: 2,
    maxCapsules: 5,
    maxStudioClients: 0,
    maxStudioInvitesPerMonth: 0,
    maxStudioExportsPerMonth: 2,
    studioFeatureAccess: false,
  },
  PRO: {
    maxIdentities: 12,
    maxCapsules: 50,
    maxStudioClients: 0,
    maxStudioInvitesPerMonth: 0,
    maxStudioExportsPerMonth: 15,
    studioFeatureAccess: false,
  },
  STUDIO: {
    maxIdentities: 25,
    maxCapsules: 120,
    maxStudioClients: 15,
    maxStudioInvitesPerMonth: 45,
    maxStudioExportsPerMonth: 60,
    studioFeatureAccess: true,
  },
  STUDIO_PLUS: {
    maxIdentities: 80,
    maxCapsules: 400,
    maxStudioClients: 60,
    maxStudioInvitesPerMonth: 150,
    maxStudioExportsPerMonth: 400,
    studioFeatureAccess: true,
  },
};

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

/** Plan catalogue côté UI (les Price ids viennent des variables d’environnement). */
export const BILLING_PLAN_CATALOG: {
  key: SubscriptionPlanKey;
  name: string;
  description: string;
  highlight?: boolean;
}[] = [
  {
    key: "FREE",
    name: "Free",
    description: "Découverte : identités et capsules limitées, pas d’espace Studio client.",
  },
  {
    key: "PRO",
    name: "Pro",
    description: "Créateur / indépendant : plus d’identités, de capsules et d’exports.",
    highlight: true,
  },
  {
    key: "STUDIO",
    name: "Studio",
    description: "Agence : clients liés, invitations sécurisées, quotas Studio étendus.",
  },
  {
    key: "STUDIO_PLUS",
    name: "Studio+",
    description: "Volume : limites majores pour studios et équipes ambitieuses.",
  },
];
