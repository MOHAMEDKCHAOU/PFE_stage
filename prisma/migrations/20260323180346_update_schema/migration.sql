-- CreateTable
CREATE TABLE "IdentityProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bio" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "IdentityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,

    CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capsule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,

    CONSTRAINT "Capsule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapsuleOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "capsuleId" TEXT NOT NULL,

    CONSTRAINT "CapsuleOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapsuleBranch" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cta" TEXT NOT NULL,

    CONSTRAINT "CapsuleBranch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityProfile_slug_key" ON "IdentityProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CapsuleBranch_optionId_key" ON "CapsuleBranch"("optionId");

-- AddForeignKey
ALTER TABLE "IdentityProfile" ADD CONSTRAINT "IdentityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "IdentityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "IdentityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capsule" ADD CONSTRAINT "Capsule_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "IdentityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapsuleOption" ADD CONSTRAINT "CapsuleOption_capsuleId_fkey" FOREIGN KEY ("capsuleId") REFERENCES "Capsule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapsuleBranch" ADD CONSTRAINT "CapsuleBranch_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CapsuleOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
