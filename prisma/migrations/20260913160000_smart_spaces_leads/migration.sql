ALTER TABLE "SubscriptionUsage" ADD COLUMN IF NOT EXISTS "smartScansCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SubscriptionUsage" ADD COLUMN IF NOT EXISTS "aiActionsCount" INTEGER NOT NULL DEFAULT 0;

-- CRM-lite leads
CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "message" TEXT,
  "source" TEXT NOT NULL DEFAULT 'DIRECT',
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "capsuleId" TEXT,
  "branchLabel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "identityId" TEXT NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_userId_status_createdAt_idx" ON "Lead"("userId", "status", "createdAt" DESC);
CREATE INDEX "Lead_identityId_createdAt_idx" ON "Lead"("identityId", "createdAt" DESC);
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SmartSpace" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "coverUrl" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "identityId" TEXT NOT NULL,
  CONSTRAINT "SmartSpace_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SmartSpace_slug_key" ON "SmartSpace"("slug");
CREATE INDEX "SmartSpace_userId_updatedAt_idx" ON "SmartSpace"("userId", "updatedAt" DESC);
CREATE INDEX "SmartSpace_identityId_status_idx" ON "SmartSpace"("identityId", "status");
ALTER TABLE "SmartSpace" ADD CONSTRAINT "SmartSpace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmartSpace" ADD CONSTRAINT "SmartSpace_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SmartSpaceScene" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "panoramaUrl" TEXT,
  "previewUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'EMPTY',
  "startYaw" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "spaceId" TEXT NOT NULL,
  CONSTRAINT "SmartSpaceScene_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SmartSpaceScene_spaceId_sortOrder_idx" ON "SmartSpaceScene"("spaceId", "sortOrder");
ALTER TABLE "SmartSpaceScene" ADD CONSTRAINT "SmartSpaceScene_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "SmartSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SmartSpaceCapture" (
  "id" TEXT NOT NULL,
  "assetUrl" TEXT NOT NULL,
  "alpha" DOUBLE PRECISION,
  "beta" DOUBLE PRECISION,
  "gamma" DOUBLE PRECISION,
  "qualityScore" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sceneId" TEXT NOT NULL,
  CONSTRAINT "SmartSpaceCapture_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SmartSpaceCapture_sceneId_createdAt_idx" ON "SmartSpaceCapture"("sceneId", "createdAt");
ALTER TABLE "SmartSpaceCapture" ADD CONSTRAINT "SmartSpaceCapture_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "SmartSpaceScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SmartSpaceHotspot" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "yaw" DOUBLE PRECISION NOT NULL,
  "pitch" DOUBLE PRECISION NOT NULL,
  "targetUrl" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "sceneId" TEXT NOT NULL,
  "targetSceneId" TEXT,
  CONSTRAINT "SmartSpaceHotspot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SmartSpaceHotspot_sceneId_idx" ON "SmartSpaceHotspot"("sceneId");
CREATE INDEX "SmartSpaceHotspot_targetSceneId_idx" ON "SmartSpaceHotspot"("targetSceneId");
ALTER TABLE "SmartSpaceHotspot" ADD CONSTRAINT "SmartSpaceHotspot_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "SmartSpaceScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmartSpaceHotspot" ADD CONSTRAINT "SmartSpaceHotspot_targetSceneId_fkey" FOREIGN KEY ("targetSceneId") REFERENCES "SmartSpaceScene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SmartSpaceEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "sessionKey" TEXT,
  "hotspotId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "spaceId" TEXT NOT NULL,
  "sceneId" TEXT,
  CONSTRAINT "SmartSpaceEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SmartSpaceEvent_spaceId_createdAt_idx" ON "SmartSpaceEvent"("spaceId", "createdAt" DESC);
CREATE INDEX "SmartSpaceEvent_sceneId_createdAt_idx" ON "SmartSpaceEvent"("sceneId", "createdAt" DESC);
ALTER TABLE "SmartSpaceEvent" ADD CONSTRAINT "SmartSpaceEvent_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "SmartSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmartSpaceEvent" ADD CONSTRAINT "SmartSpaceEvent_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "SmartSpaceScene"("id") ON DELETE SET NULL ON UPDATE CASCADE;
