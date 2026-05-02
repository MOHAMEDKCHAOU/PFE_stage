-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SubscriptionUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "exportsCount" INTEGER NOT NULL DEFAULT 0,
    "invitesCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubscriptionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionUsage_userId_idx" ON "SubscriptionUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionUsage_userId_periodKey_key" ON "SubscriptionUsage"("userId", "periodKey");

-- AddForeignKey
ALTER TABLE "SubscriptionUsage" ADD CONSTRAINT "SubscriptionUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
