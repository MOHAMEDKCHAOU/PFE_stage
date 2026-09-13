-- Invitation Studio (lien signé côté serveur = jeton opaque + hash)
CREATE TABLE "StudioClientInvite" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "affiliateUserId" TEXT NOT NULL,
    "inviteeEmail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "clientUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioClientInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudioClientInvite_tokenHash_key" ON "StudioClientInvite"("tokenHash");

CREATE INDEX "StudioClientInvite_affiliateUserId_idx" ON "StudioClientInvite"("affiliateUserId");

CREATE INDEX "StudioClientInvite_expiresAt_idx" ON "StudioClientInvite"("expiresAt");

ALTER TABLE "StudioClientInvite" ADD CONSTRAINT "StudioClientInvite_affiliateUserId_fkey" FOREIGN KEY ("affiliateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudioClientInvite" ADD CONSTRAINT "StudioClientInvite_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
