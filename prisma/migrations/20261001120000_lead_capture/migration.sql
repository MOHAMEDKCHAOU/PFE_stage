-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "messageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_messageId_key" ON "Lead"("messageId");

-- CreateIndex
CREATE INDEX "Lead_identityId_email_idx" ON "Lead"("identityId", "email");

-- CreateIndex
CREATE INDEX "Lead_capsuleId_idx" ON "Lead"("capsuleId");

-- capsuleId n’était pas vérifié : on retire les références orphelines avant la contrainte.
UPDATE "Lead" SET "capsuleId" = NULL
WHERE "capsuleId" IS NOT NULL AND "capsuleId" NOT IN (SELECT "id" FROM "Capsule");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_capsuleId_fkey" FOREIGN KEY ("capsuleId") REFERENCES "Capsule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

