-- CreateTable
CREATE TABLE "StudioPartnerProfile" (
    "id" TEXT NOT NULL,
    "affiliateUserId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "agencyName" TEXT,
    "logoUrl" TEXT,
    "joinsCount" INTEGER NOT NULL DEFAULT 0,
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioPartnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioJoinRequest" (
    "id" TEXT NOT NULL,
    "affiliateUserId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL DEFAULT 'QR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "StudioJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudioPartnerProfile_affiliateUserId_key" ON "StudioPartnerProfile"("affiliateUserId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioPartnerProfile_code_key" ON "StudioPartnerProfile"("code");

-- CreateIndex
CREATE INDEX "StudioJoinRequest_affiliateUserId_status_createdAt_idx" ON "StudioJoinRequest"("affiliateUserId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StudioJoinRequest_clientUserId_status_idx" ON "StudioJoinRequest"("clientUserId", "status");

-- AddForeignKey
ALTER TABLE "StudioPartnerProfile" ADD CONSTRAINT "StudioPartnerProfile_affiliateUserId_fkey" FOREIGN KEY ("affiliateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioJoinRequest" ADD CONSTRAINT "StudioJoinRequest_affiliateUserId_fkey" FOREIGN KEY ("affiliateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioJoinRequest" ADD CONSTRAINT "StudioJoinRequest_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

