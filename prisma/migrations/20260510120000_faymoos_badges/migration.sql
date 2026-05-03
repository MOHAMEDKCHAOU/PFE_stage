-- Faymoos badges (catégories Expertise / Crédibilité / Impact)

CREATE TYPE "BadgeCategory" AS ENUM ('EXPERTISE', 'CREDIBILITY', 'IMPACT');
CREATE TYPE "BadgeTier" AS ENUM ('VERIFIED', 'EXPERT');
CREATE TYPE "BadgeGrantSource" AS ENUM ('AUTO', 'EXTERNAL', 'ADMIN');

CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "BadgeCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BadgeDefinition_slug_key" ON "BadgeDefinition"("slug");

CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "tier" "BadgeTier" NOT NULL,
    "source" "BadgeGrantSource" NOT NULL DEFAULT 'AUTO',
    "evidence" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "BadgeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "BadgeDefinition" ("id", "slug", "label", "description", "category", "sortOrder") VALUES
  ('bdef-expertise-profile', 'expertise_profile', 'Profil soigné', 'Headline, bio et photo renseignés — expertise visible au premier regard.', 'EXPERTISE', 10),
  ('bdef-credibility-links', 'credibility_presence', 'Présence en ligne', 'Liens professionnels (LinkedIn, GitHub, …) renseignés.', 'CREDIBILITY', 20),
  ('bdef-credibility-verified', 'credibility_verified', 'Identité vérifiée', 'Compte validé par l’équipe Faymoos.', 'CREDIBILITY', 5),
  ('bdef-impact-active', 'impact_creator', 'Créateur actif', 'Au moins une capsule publiée sur la plateforme.', 'IMPACT', 30);
