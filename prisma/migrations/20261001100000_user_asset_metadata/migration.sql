-- AlterTable
ALTER TABLE "UserAsset" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "originalName" TEXT,
ADD COLUMN     "sha256" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'LIBRARY',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "width" INTEGER;

-- CreateIndex
CREATE INDEX "UserAsset_userId_sha256_idx" ON "UserAsset"("userId", "sha256");

-- CreateIndex
CREATE INDEX "UserAsset_url_idx" ON "UserAsset"("url");


-- Origine des médias déjà enregistrés, déduite de leur dossier.
UPDATE "UserAsset" SET "source" = 'PORTFOLIO' WHERE "url" LIKE '/uploads/portfolio/%';
