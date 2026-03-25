/*
  Warnings:

  - Added the required column `updatedAt` to the `Capsule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CapsuleBranch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CapsuleOption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `IdentityProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PortfolioProject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Testimonial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Capsule" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CapsuleBranch" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "proof" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CapsuleOption" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "IdentityProfile" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "cover" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PortfolioProject" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "company" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "CapsuleSession" (
    "id" TEXT NOT NULL,
    "capsuleId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "CapsuleSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapsuleEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapsuleEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CapsuleSession" ADD CONSTRAINT "CapsuleSession_capsuleId_fkey" FOREIGN KEY ("capsuleId") REFERENCES "Capsule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapsuleEvent" ADD CONSTRAINT "CapsuleEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CapsuleSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
