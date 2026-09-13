-- CreateEnum
CREATE TYPE "UserAssetKind" AS ENUM ('IMAGE', 'VIDEO', 'MODEL_3D');

-- CreateTable
CREATE TABLE "UserAsset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "UserAssetKind" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAsset_userId_kind_createdAt_idx" ON "UserAsset"("userId", "kind", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "UserAsset" ADD CONSTRAINT "UserAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
