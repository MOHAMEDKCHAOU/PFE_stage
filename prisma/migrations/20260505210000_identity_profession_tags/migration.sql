-- Métier / domaine + tags optionnels pour IdentityProfile
ALTER TABLE "IdentityProfile" ADD COLUMN IF NOT EXISTS "profession" TEXT;
ALTER TABLE "IdentityProfile" ADD COLUMN IF NOT EXISTS "tags" JSONB;
