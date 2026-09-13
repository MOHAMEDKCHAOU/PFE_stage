-- AlterTable
ALTER TABLE "Capsule" ADD COLUMN     "commentsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CapsuleComment" (
    "id" TEXT NOT NULL,
    "capsuleId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isOwnerReply" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "reviewerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapsuleComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CapsuleComment_capsuleId_status_idx" ON "CapsuleComment"("capsuleId", "status");

-- CreateIndex
CREATE INDEX "CapsuleComment_capsuleId_createdAt_idx" ON "CapsuleComment"("capsuleId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CapsuleComment_parentId_idx" ON "CapsuleComment"("parentId");

-- AddForeignKey
ALTER TABLE "CapsuleComment" ADD CONSTRAINT "CapsuleComment_capsuleId_fkey" FOREIGN KEY ("capsuleId") REFERENCES "Capsule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapsuleComment" ADD CONSTRAINT "CapsuleComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CapsuleComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
