-- CreateTable
CREATE TABLE "SubscriptionPlanPrice" (
    "planKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyCents" INTEGER NOT NULL,
    "yearlyCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlanPrice_pkey" PRIMARY KEY ("planKey")
);

-- Tarifs PFE (EUR) : Pro 19/190, Studio 29/290, Studio+ 39/390
INSERT INTO "SubscriptionPlanPrice" ("planKey", "name", "description", "monthlyCents", "yearlyCents", "currency", "sortOrder", "updatedAt")
VALUES
  ('PRO', 'Pro', 'Créateur / indépendant : plus d’identités, de capsules et d’exports.', 1900, 19000, 'EUR', 1, NOW()),
  ('STUDIO', 'Studio', 'Agence : clients liés, invitations sécurisées, quotas Studio étendus.', 2900, 29000, 'EUR', 2, NOW()),
  ('STUDIO_PLUS', 'Studio+', 'Volume : limites majores pour studios et équipes ambitieuses.', 3900, 39000, 'EUR', 3, NOW());
