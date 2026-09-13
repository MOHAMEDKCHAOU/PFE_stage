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
  /** Monthly successful Smart Space reconstructions */
  maxSmartScansPerMonth: number;
  /** Monthly premium AI actions */
  maxAiActionsPerMonth: number;
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
    maxSmartScansPerMonth: 1,
    maxAiActionsPerMonth: 25,
    studioFeatureAccess: false,
  },
  PRO: {
    maxIdentities: 12,
    maxCapsules: 50,
    maxStudioClients: 0,
    maxStudioInvitesPerMonth: 0,
    maxStudioExportsPerMonth: 15,
    maxSmartScansPerMonth: 2,
    maxAiActionsPerMonth: 400,
    studioFeatureAccess: false,
  },
  STUDIO: {
    maxIdentities: 25,
    maxCapsules: 120,
    maxStudioClients: 15,
    maxStudioInvitesPerMonth: 45,
    maxStudioExportsPerMonth: 60,
    maxSmartScansPerMonth: 12,
    maxAiActionsPerMonth: 2000,
    studioFeatureAccess: true,
  },
  STUDIO_PLUS: {
    maxIdentities: 80,
    maxCapsules: 400,
    maxStudioClients: 60,
    maxStudioInvitesPerMonth: 150,
    maxStudioExportsPerMonth: 400,
    maxSmartScansPerMonth: 50,
    maxAiActionsPerMonth: 10000,
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
    description: "Try Faymoos with a limited presence, AI actions and one Smart Scan.",
  },
  {
    key: "PRO",
    name: "Pro",
    description: "For independent professionals: premium presence, AI, analytics and Smart Spaces.",
    highlight: true,
  },
  {
    key: "STUDIO",
    name: "Studio",
    description: "For agencies: managed clients, reporting, AI and 12 Smart Scans per month.",
  },
  {
    key: "STUDIO_PLUS",
    name: "Studio+",
    description: "Higher-volume agencies with larger client, AI and Smart Scan limits.",
  },
];
