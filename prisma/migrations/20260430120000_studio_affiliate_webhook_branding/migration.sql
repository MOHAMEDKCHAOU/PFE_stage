-- Studio (affilié) + premium identity fields
CREATE TABLE IF NOT EXISTS "AffiliateClient" (
    "id" TEXT NOT NULL,
    "affiliateUserId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateClient_affiliateUserId_clientUserId_key" ON "AffiliateClient"("affiliateUserId", "clientUserId");

CREATE INDEX IF NOT EXISTS "AffiliateClient_affiliateUserId_idx" ON "AffiliateClient"("affiliateUserId");

CREATE INDEX IF NOT EXISTS "AffiliateClient_clientUserId_idx" ON "AffiliateClient"("clientUserId");

ALTER TABLE "AffiliateClient" DROP CONSTRAINT IF EXISTS "AffiliateClient_affiliateUserId_fkey";
ALTER TABLE "AffiliateClient" ADD CONSTRAINT "AffiliateClient_affiliateUserId_fkey" FOREIGN KEY ("affiliateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AffiliateClient" DROP CONSTRAINT IF EXISTS "AffiliateClient_clientUserId_fkey";
ALTER TABLE "AffiliateClient" ADD CONSTRAINT "AffiliateClient_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IdentityProfile" ADD COLUMN IF NOT EXISTS "hideBranding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "IdentityProfile" ADD COLUMN IF NOT EXISTS "ctaWebhookUrl" TEXT;
ALTER TABLE "IdentityProfile" ADD COLUMN IF NOT EXISTS "ctaWebhookSecret" TEXT;
