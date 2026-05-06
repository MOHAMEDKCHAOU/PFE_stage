# Faymoos — Plateforme d’identités professionnelles et de capsules interactives

Document destiné au **rapport de PFE** : description détaillée du dépôt, de l’architecture, des dossiers, des modèles de données et des fonctionnalités. **Faymoos** est une application web **Next.js** qui permet de créer des **identités professionnelles** (profils publics) et des **capsules** à choix multiples (branches, CTA, preuves), avec **Studio** pour affiliés, **analytics**, **Explore / recommandations**, **facturation** (Stripe ou mode démo), **IA** (OpenAI), **commentaires modérés**, **médiathèque**, et un système de **badges & score de crédibilité Faymoos**.

---

## Sommaire

1. [Contexte et objectifs](#contexte-et-objectifs)  
2. [Stack technique](#stack-technique)  
3. [Architecture logicielle](#architecture-logicielle)  
4. [Arborescence du dépôt (détail par dossier)](#arborescence-du-dépôt-détail-par-dossier)  
5. [Modèle de données (Prisma / PostgreSQL)](#modèle-de-données-prisma--postgresql)  
6. [Fonctionnalités par grand module](#fonctionnalités-par-grand-module)  
7. [API HTTP](#api-http)  
8. [Pages et parcours utilisateur](#pages-et-parcours-utilisateur)  
9. [Installation](#installation)  
10. [Variables d’environnement](#variables-denvironnement)  
11. [Scripts npm et tests](#scripts-npm-et-tests)  
12. [Build et déploiement](#build-et-déploiement)  
13. [Historique des migrations Prisma](#historique-des-migrations-prisma)  
14. [Documentation complémentaire](#documentation-complémentaire)  
15. [Licence et contexte académique](#licence-et-contexte-académique)

---

## Contexte et objectifs

Le projet vise à offrir une alternative structurée aux pages « lien en bio » classiques : au lieu d’une simple liste de liens, l’utilisateur construit un **parcours guidé** (capsule) où le visiteur choisit des options et atteint des **appels à l’action** mesurables. Les objectifs techniques couverts dans le dépôt incluent :

- **Saas léger** : comptes, rôles (`USER`, `AFFILIATE`, `ADMIN`), session sécurisée par cookie.  
- **Monétisation** : plans d’abonnement, limites de ressources, intégration **Stripe** et **mode démo** sans carte.  
- **Différenciation** : **Studio** (affilié–client), **analytics** de parcours, **IA** pour accélérer la création de contenu.  
- **Confiance** : **badges** (automatiques, manuels admin, externes prévus), **score Faymoos** agrégé pour le profil public.  
- **Engagement** : favoris, messages, notifications, **commentaires publics modérés**, e-mail optionnel (Resend).

---

## Stack technique

| Domaine | Technologie |
|--------|-------------|
| Framework | **Next.js 16** (App Router — dossier `app/` à la racine du dépôt) |
| UI | **React 19**, **Tailwind CSS 4** |
| Base de données | **PostgreSQL** via **Prisma 5** (client généré dans `src/generated/prisma`) |
| Auth | Cookie HTTP-only **`faymoos_session`** (sessions maison sur login/register, voir `src/lib/auth.ts`) |
| Paiements | **Stripe** (Checkout, portail client, webhooks) — contournable en mode démo |
| IA | **OpenAI** (génération/amélioration de texte, insights) |
| Validation / API | **Zod** (où utilisé dans les handlers), handlers testables |
| Tests | **Vitest** (`src/__tests__/`) |
| PDF (Studio) | **jspdf** (export clients, voir `src/lib/studio-clients-pdf.ts`) |
| QR | **qrcode** (workflows type scan, voir `ScanCaptureWorkflow`) |

**Note** : `next-auth` est listé dans `package.json` ; l’authentification effective du projet repose sur les routes **`/api/login`** et **`/api/register`** et la session cookie décrite ci-dessus.

---

## Architecture logicielle

### Séparation `app/` vs `src/route-handlers/`

- **`app/`** : **routes Next.js** (pages, layouts, `app/api/**/route.ts`). Pour la plupart des API, les fichiers sous `app/api/` sont des **stubs** qui ré-exportent les fonctions `GET`/`POST`/etc. depuis `src/route-handlers/api/`.  
- **`src/route-handlers/api/`** : **implémentation métier** (Prisma, validation, droits), réutilisable et importable par les tests Vitest.  
- Certains endpoints ont toute la logique **directement** dans `app/api/...` (liste dans [`docs/API_ROUTES.md`](./docs/API_ROUTES.md)).

Cette convention est expliquée dans **`docs/API_ROUTES.md`** et évite de mélanger l’arborescence imposée par Next avec le code métier volumineux.

### Alias TypeScript

L’alias **`@/*`** pointe vers **` src/*`** (voir `tsconfig.json`). Les handlers sont importés comme `@/route-handlers/api/...`.

### Configuration Next

- **`next.config.ts`** : `turbopack.root` = répertoire du projet (build/dev cohérents).

---

## Arborescence du dépôt (détail par dossier)

### Racine

| Élément | Rôle |
|---------|------|
| `package.json` | Dépendances, scripts (`dev`, `build`, `test`, `admin:ensure`, `postinstall` → `prisma generate`) |
| `package-lock.json` | Verrouillage des versions npm |
| `next.config.ts` | Configuration Next (Turbopack) |
| `tsconfig.json` | Cibles TS, alias `@/*` → `src/*` |
| `postcss.config.mjs` | **Tailwind 4** / PostCSS |
| `eslint.config.mjs` | Règles ESLint |
| `prisma.config.ts` | Config Prisma (outil) |
| `.env` / `.env.example` | Secrets et modèles de variables (ne pas commiter `.env`) |
| `.gitignore` | Fichiers exclus du dépôt |
| `README.md` | Ce document |
| `AGENTS.md` / `CLAUDE.md` | Règles pour assistants / contexte Next du projet |

### `app/` — App Router (interface et stubs API)

| Zone | Contenu |
|------|--------|
| `app/layout.tsx` | Layout racine de l’application |
| `app/page.tsx` | Page d’accueil publique |
| `app/explore/page.tsx` | **Explore** — découverte d’identités / capsules |
| `app/(auth)/` | **Login** (`login/page.tsx`), **Register** (`register/page.tsx`), `layout.tsx` |
| `app/(dashboard)/` | Espace connecté : `layout.tsx` (nav, cloche notifications), sous-dossier `dashboard/` avec toutes les pages tableau de bord |
| `app/capsule/[slug]/` | **Vue publique capsule** : `page.tsx`, `CapsuleViewer.tsx`, `badges/page.tsx` (badges publics par slug d’identité si applicable) |
| `app/invite/studio/[token]/` | **Acceptation invitation Studio** (page + client `StudioInviteAcceptClient.tsx`) |
| `app/api/**/route.ts` | **Endpoints HTTP** : soit logique inline, soit `export { GET, POST, … } from "@/route-handlers/..."` |

Les groupes de routes `(auth)` et `(dashboard)` n’apparaissent pas dans l’URL ; ils servent à organiser layouts et pages.

### `app/(dashboard)/dashboard/` — Pages principales du tableau de bord

À titre indicatif (noms de fichiers utiles pour le rapport) :

| Chemin (sous `dashboard/`) | Rôle |
|----------------------------|------|
| `page.tsx` | Accueil dashboard utilisateur |
| `identities/page.tsx` | Gestion des identités / profils |
| `capsules/page.tsx` | Liste / accès aux capsules |
| `favorites/page.tsx` | Capsules favorites |
| `messages/page.tsx` | Messages reçus (contact depuis capsules) |
| `assets/page.tsx` | **Asset library** (fichiers uploadés) |
| `billing/page.tsx` | Abonnement / facturation |
| `analytics/page.tsx` et `analytics/[capsuleId]/page.tsx` | **Analytics** agrégés et par capsule |
| `studio/page.tsx` | **Espace Studio** (affilié) |
| `capsule-comments/page.tsx` | **Modération** des commentaires publics |
| `badges/page.tsx` | Badges & score côté utilisateur |
| `space/wizard/templates/page.tsx` | **Space Wizard** — choix de template |
| `space/wizard/create/page.tsx` | Création de capsule (assistant) |
| `space/wizard/edit/[capsuleId]/` | Édition (`page.tsx`, `SpaceEditorClient.tsx`) |
| `space/preview/[capsuleId]/page.tsx` | Prévisualisation |
| `admin/page.tsx` | Tableau de bord **admin** (liens rapides) |
| `admin/users/page.tsx` | Gestion utilisateurs |
| `admin/capsules/page.tsx` | Gestion capsules |
| `admin/badges/page.tsx` | **Gestion badges** (catalogue, utilisateur, grant/revoke, recalcul auto) |

### `src/route-handlers/api/` — Implémentation des API « miroir »

Organisation par domaine (dossiers) :

- **Auth / compte** : `login/`, `register/`  
- **Identité & contenu** : `identity/`, `capsules/` (dont logique commentaires publics dans `public-comments-handlers.ts`), `options/`, `branches/`, `portfolio/`, `testimonials/`  
- **Analytics** : `analytics/`, `analytics/track/`  
- **IA** : `ai/generate-capsule/`, `ai/improve-text/`, `ai/insights/`  
- **Découverte** : `recommendations/`  
- **Commentaires modération** : `capsule-comments/moderate/`, `capsule-comments/my-capsules/`  
- **Badges** : `badges/public/`, `admin/badges/`, `admin/badges/user/`, `admin/badges/grant/`, `admin/badges/revoke/`  
- **Studio** : `studio/clients/`, `studio/clients/export/`, `studio/invites/`, `studio/invites/verify/`, `studio/invites/accept/`, `studio/invites/inbox/`, `studio/metrics/`  
- **Facturation** : `billing/plans/`, `billing/checkout/`, `billing/portal/`, `billing/demo-activate/`  
- **Paiements** : `webhooks/stripe/`  

Les tests Vitest ciblent ces modules sans passer par le serveur Next.

### `src/lib/` — Bibliothèques et règles métier

| Fichier (extrait) | Rôle |
|-------------------|------|
| `prisma.ts` | Client Prisma singleton |
| `auth.ts` | Lecture session, `requireUser`, `requireAdmin`, etc. |
| `subscription-plans.ts` | Définition des plans FREE / PRO / STUDIO / STUDIO_PLUS |
| `subscription-guards.ts` | Quotas identités / capsules ; snapshot **`billing`** (`GET /api/me`) incluant **`canHideBranding`** |
| `subscription-entitlements.ts` | Plan effectif, quotas (`getEffectivePlan`, `getLimitsForUser`) ; white-label capsule : **`canHidePlatformBranding`**, **`resolvePublicHideBranding`** |
| `stripe-server.ts`, `stripe-sync-user.ts` | Intégration Stripe côté serveur |
| `billing-demo-mode.ts` | Détection mode démo facturation |
| `studio-access.ts` | Accès affilié aux ressources client |
| `studio-plan-guard.ts` | Garde-fous quota Studio |
| `studio-invite-token.ts`, `studio-invite-accept-logic.ts` | Jetons d’invitation hashés, flux d’acceptation |
| `studio-client-email.ts` | E-mails liés au Studio (si configuré) |
| `studio-clients-pdf.ts` | Export PDF liste clients |
| `space-themes.ts` | Thèmes visuels Space / presets |
| `openai.ts` | Client OpenAI |
| `faymoos-badges.ts` | Définitions canoniques des badges, `ensureBadgeDefinitions`, synchronisation **AUTO**, `computeFaymoosScore`, payload public |
| `capsule-comment-notify.ts` | Notification / e-mail nouveau commentaire (Resend optionnel) |
| `rate-limit-memory.ts` | Limitation de débit en mémoire (où utilisé) |
| `asset-upload.ts` | Logique upload / contraintes fichiers |
| `generatePDF.ts` | Utilitaires PDF génériques |
| `validations/auth.ts` | Schémas / validations auth |

### `src/components/` — Composants React partagés

| Composant | Usage typique |
|-----------|----------------|
| `Navbar.tsx` | Navigation |
| `NotificationBell.tsx` | Notifications in-app |
| `ChatBot.tsx` | Widget chat (API `/api/chatbot`) |
| `CapsuleCommentsSection.tsx` | Bloc commentaires sur capsule publique |
| `EditProfileModal.tsx` | Édition profil ; white-label **`hideBranding`** selon **`ownerCanHideBranding`** (plan du propriétaire) |
| `WelcomeToFaymoos.tsx` | Accueil / onboarding |
| `StudioInviteInbox.tsx` | Boîte invitations Studio |
| `ScanCaptureWorkflow.tsx` | Workflow avec capture / QR |
| `PublicProfileBadges.tsx` | Affichage badges / score sur profil public |

*(Des versions ou doublons de pages peuvent exister sous `src/app/` — l’App Router **actif** pour le site est `app/` à la racine ; voir `docs/API_ROUTES.md`.)*

### `src/modules/recommendation/`

- **`recommendation.service.ts`** : moteur de **recommandations** (similarité textuelle, popularité, signaux invité/connecté), consommé par `/api/recommendations` (et indirectement Explore).

### `src/generated/prisma/`

- Client Prisma **généré** — ne pas éditer à la main ; régénérer avec `npx prisma generate`.

### `src/__tests__/`

- Tests **Vitest** sur handlers : `login`, `register`, `identity`, `capsules`, `options`, `branches`, `public-capsule-comments`, etc.

### `prisma/`

| Fichier | Rôle |
|---------|------|
| `schema.prisma` | Schéma complet (modèles, enums, relations) |
| `migrations/*/migration.sql` | Historique SQL versionné |
| `seed.js` | Données de démonstration (à valider avant exécution) |
| `ensure-admin.js` | Script **`npm run admin:ensure`** pour garantir un compte ADMIN |

### `public/`

- Assets statiques (`favicon`, logos, SVG), dossiers **`uploads/`** (avatars, couvertures, portfolio, library) — souvent **gitignorés** en partie ; des fichiers exemple peuvent être présents.

### `docs/`

- **`API_ROUTES.md`** : tableau des routes, convention stubs / handlers, liste des fichiers **full** sous `app/api/`.

---

## Modèle de données (Prisma / PostgreSQL)

### Utilisateur et facturation

- **`User`** : e-mail unique, mot de passe hashé, **`role`** (`USER` | `ADMIN` | `AFFILIATE`), champs **Stripe** (`stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, `subscriptionPlan`, `currentPeriodEnd`).  
- **`SubscriptionUsage`** : compteurs **mensuels** (exports Studio, invitations) par `periodKey` (ex. `2026-05`).  
- **`SubscriptionPlanPrice`** : tarifs **catalogue** (mensuel / annuel en centimes) pour l’UI.

### Badges et crédibilité

- **`BadgeDefinition`** : `slug`, `label`, `description`, **`BadgeCategory`** (`EXPERTISE`, `CREDIBILITY`, `IMPACT`), ordre d’affichage.  
- **`UserBadge`** : lien utilisateur ↔ badge, **`BadgeTier`** (`VERIFIED`, `EXPERT`), **`BadgeGrantSource`** (`AUTO`, `EXTERNAL`, `ADMIN`), `evidence`, `verifiedAt`. Contrainte **unique** `(userId, badgeId)`.

### Identité et contenu

- **`IdentityProfile`** : identité publique (nom, **slug** unique, type, bio, headline, avatar, cover, thème, `socialLinks` JSON ; champ **`hideBranding`** — préférence « sans branding Faymoos » sur la capsule publique, **effective uniquement si le propriétaire a un plan payant effectif** (Pro / Studio / Studio+, ou admin) ; webhooks **`ctaWebhookUrl`** / secret).  
- **`PortfolioProject`**, **`Testimonial`** : rattachés à une identité.  
- **`Capsule`** : titre, objectif, `layoutPreset`, `isPublished`, `editorHotspots` (JSON), `commentsEnabled`.  
- **`CapsuleOption`** puis **`CapsuleBranch`** (une branche par option) : headline, description, CTA, champ **`proof`**.

### Engagement et analytics

- **`CapsuleSession`**, **`CapsuleEvent`** : parcours visiteur (`START`, `OPTION_CLICK`, `CTA_CLICK`).  
- **`CapsuleComment`** : commentaires publics modérés (`PENDING` / `APPROVED` / `REJECTED`), fils optionnels (`parentId`).  
- **`Favorite`**, **`Message`**, **`Notification`**.  
- **`UserAsset`** + enum **`UserAssetKind`** (`IMAGE`, `VIDEO`, `MODEL_3D`).

### Studio (affiliés)

- **`AffiliateClient`** : paire affilié ↔ client.  
- **`StudioClientInvite`** : `tokenHash` (SHA-256 du jeton), expiration, révocation, acceptation, e-mail invité optionnel.

---

## Fonctionnalités par grand module

### Authentification et rôles

Inscription / connexion (`/register`, `/login`), déconnexion (`/api/logout`), cookie **`faymoos_session`**. Rôles : utilisateur standard, **affilié Studio**, **administrateur**.

### Identités et capsules

CRUD profils multiples, capsules à options/branches, quotas selon plan. Mise à jour identité peut déclencher **recalcul des badges AUTO** (voir implémentation dans `faymoos-badges.ts` et hooks sur `PUT /api/identity`). **`GET /api/identity`** enrichit chaque identité avec **`ownerCanHideBranding`** (droit du **propriétaire** du profil — pertinent pour un affilié Studio éditant un client). **`PUT /api/identity`** avec **`hideBranding: true`** est refusé (**403**) si ce propriétaire n’a pas un plan payant effectif.

### Espace public

Page **`/capsule/[slug]`** : parcours interactif, analytics, favoris si connecté, messages, chatbot, portfolio / témoignages, commentaires modérés. Le pied de page « Powered by Faymoos Platform » est masqué pour les visiteurs lorsque **`resolvePublicHideBranding`** est vrai (préférence `hideBranding` **et** éligibilité actuelle du propriétaire) ; ainsi, une rétrogradation en plan Free fait réapparaître le branding sans migration SQL.

### Space Wizard

Templates, création/édition, hotspots éditeur, publication, réglage **commentaires** par capsule.

### Explore et recommandations

**`/explore`** et APIs **`/api/explore`**, **`/api/recommendations`** : découverte et classement enrichi.

### Messages, notifications, favoris

Boîte **`/dashboard/messages`**, export CSV selon droits ; cloche notifications ; favoris par capsule.

### Commentaires capsules

Section publique, modération dashboard, notifications type nouveau commentaire, e-mail optionnel **Resend**.

### Analytics

Agrégations et suivi d’événements par session ; pages dashboard analytics.

### Studio (affiliés)

Clients liés, invitations par jeton, métriques, export CSV/PDF, quotas mensuels ; accès **studio-access** aux ressources des clients.

### Facturation

Plans, Checkout Stripe, portail client, webhooks ; **mode démo** (`BILLING_DEMO_MODE` ou absence de clé Stripe en dev) via **`POST /api/billing/demo-activate`** ; objet **`billing`** dans **`GET /api/me`** (plan effectif, limites, usage, et **`canHideBranding`** : indicateur UI pour activer le white-label sur les capsules du compte connecté).

### Intelligence artificielle

Génération de capsule, amélioration de texte, insights — sous réserve de **`OPENAI_API_KEY`**.

### Badges Faymoos et score

- **Définitions** : conservées en base et synchronisées avec **`ensureBadgeDefinitions()`** (slugs canoniques : `expertise_profile`, `credibility_presence`, `credibility_verified`, `impact_creator`, etc.).  
- **Sources** : règles **AUTO** (profil, liens, capsules publiées…), **ADMIN** (attribution / révocation depuis **`/dashboard/admin/badges`**), **EXTERNAL** (prévu pour intégrations).  
- **API publique** : **`GET /api/badges/public`** ; affichage sur **`PublicProfileBadges`**, pages **`/dashboard/badges`**, **`/capsule/[slug]/badges`**.  
- **Admin** : **`GET /api/admin/badges`**, **`GET /api/admin/badges/user`** (score + détail + option recalcul auto), **`POST /api/admin/badges/grant`**, **`DELETE /api/admin/badges/revoke`**.

### Administration

Pages admin utilisateurs, capsules, statistiques, **badges** ; APIs réservées au rôle **ADMIN** (`requireAdmin`).

---

## API HTTP

La ** liste exhaustive** des conventions (stub vs handler, endpoints implémentés uniquement sous `app/api/`) se trouve dans **[`docs/API_ROUTES.md`](./docs/API_ROUTES.md)**.

Synthèse non exhaustive :

- **Auth** : `login`, `register`, `logout`, **`me`** (profils + **`billing.canHideBranding`**)  
- **Contenu** : **`identity`** (liste avec **`ownerCanHideBranding`** ; **`PUT`** vérifie le droit avant **`hideBranding: true`**), `capsules`, `options`, `branches`, `portfolio`, `testimonials`, `upload`, `assets`  
- **Social / découverte** : `favorites`, `messages`, `messages/export`, `notifications`, `explore`, `recommendations`, `chatbot`  
- **Commentaires** : `capsules/[id]/comments`, `capsule-comments/moderate`, `my-capsules`, `export`  
- **Badges** : `badges/public`, `admin/badges`, `admin/badges/user`, `admin/badges/grant`, `admin/badges/revoke`  
- **Analytics** : `analytics`, `analytics/track`  
- **Studio** : `studio/clients`, `studio/clients/export`, `studio/invites`, `verify`, `accept`, `inbox`, `studio/metrics`  
- **Facturation** : `billing/plans`, `billing/checkout`, `billing/portal`, `billing/demo-activate`, `webhooks/stripe`  
- **Admin** : `admin/users`, `admin/capsules`, `admin/stats`  
- **IA** : `ai/generate-capsule`, `ai/improve-text`, `ai/insights`

---

## Pages et parcours utilisateur

| Parcours | URL / entrée |
|----------|----------------|
| Accueil marketing | `/` |
| Auth | `/login`, `/register` |
| Dashboard | `/dashboard`, puis sous-pages (identités, capsules, favoris, messages, assets, billing, analytics, studio, modération, badges) |
| Admin | `/dashboard/admin`, `/dashboard/admin/users`, `/dashboard/admin/capsules`, `/dashboard/admin/badges` |
| Capsule publique | `/capsule/[slug]` |
| Badges publics (profil) | `/capsule/[slug]/badges` (selon routage du projet) |
| Explore | `/explore` |
| Acceptation invitation Studio | `/invite/studio/[token]` |

---

## Installation

```bash
git clone <url-du-depot>
cd PFE_stage-main   # ou le nom de votre dossier racine Faymoos
npm install
```

Créer **`.env`** à partir de **`.env.example`** et renseigner au minimum **`DATABASE_URL`**.

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Application : [http://localhost:3000](http://localhost:3000).

**Données de démo** : `prisma/seed.js` (vérifier la cohérence avec le schéma). **Compte admin** : `npm run admin:ensure` (`prisma/ensure-admin.js`).

---

## Variables d’environnement

Résumé (détail dans **`.env.example`**) :

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | PostgreSQL |
| `OPENAI_API_KEY` | Routes IA |
| `NEXT_PUBLIC_APP_URL` | URL publique (liens, redirections) |
| `BILLING_DEMO_MODE` | `true` = abonnement sans Stripe (PFE) |
| `STRIPE_*` | Paiements réels et webhooks |
| `BILLING_GRANDFATHER_AFFILIATES` | Anciens affiliés sans Stripe (optionnel) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | E-mail commentaires (optionnel) |
| `COMMENT_NOTIFY_EMAIL` | `false` pour couper l’e-mail |

Ne jamais commiter **`.env`** ni de secrets.

---

## Scripts npm et tests

| Script | Description |
|--------|-------------|
| `npm run dev` | Développement Next.js |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint (tout le dépôt ; volumineux) |
| `npm run lint:ci` | ESLint **ciblé** API + handlers + tests (utilisé par GitLab CI) |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run admin:ensure` | Création / mise à jour utilisateur ADMIN |

---

## Docker (app + PostgreSQL)

Pour le **mémoire / démo DevOps** : **`Dockerfile`** (build multi-étapes, sortie Next.js *standalone*) et **`docker-compose.yml`** (`db`, `migrate`, `app`).

```bash
docker compose up --build
```

- Application : [http://localhost:3000](http://localhost:3000) — `BILLING_DEMO_MODE=true` et `NEXT_PUBLIC_APP_URL=http://localhost:3000` sont définis dans le compose pour un démarrage rapide.
- PostgreSQL : port **5432**, identifiants par défaut du compose : utilisateur `faymoos`, mot de passe `faymoos_dev`, base `faymoos`.
- Le service **`migrate`** exécute **`prisma migrate deploy`** une fois le conteneur Postgres sain ; l’**app** démarre après un migrate réussi (Docker Compose **v2.20+** avec `service_completed_successfully`).

OpenAI, Stripe, e-mail, etc. : les ajouter dans `docker-compose.yml` sous `app.environment` ou via un override local non versionné.

**CI GitLab** : pipeline dans **`.gitlab-ci.yml`** — étapes **lint** (`npm run lint:ci` sur `src/route-handlers`, `src/__tests__`, `app/api`) → **test** (Vitest) → **build** (`next build`), sans base de données (les pages qui interrogeaient Prisma au prérendu sont en rendu dynamique).

---

## Build et déploiement

- Après modification de **`schema.prisma`** : `npx prisma migrate deploy` (prod) ou `npx prisma migrate dev` (dev), puis `npx prisma generate`.  
- Si le build **Turbopack** pose problème (réseau, polices, etc.), essayer : **`npx next build --webpack`**.  
- Configurer **Stripe** et les **webhooks** pour un déploiement réel hors mode démo.

---

## Historique des migrations Prisma

Les migrations sous **`prisma/migrations/`** documentent l’évolution du schéma ; ordre indicatif des thèmes :

- Init schéma utilisateur / identité / capsules / analytics / favoris / messages / notifications / rôles  
- Thème identité, liens sociaux  
- Facturation abonnement Stripe, usages, tarifs catalogue  
- Champs Space Wizard (capsule), bibliothèque d’assets  
- Studio (affilié, invitations), webhooks / branding premium  
- Commentaires capsules modérés  
- **Badges Faymoos** (`20260510120000_faymoos_badges`)

Pour le rapport, vous pouvez citer cette progression comme **traçabilité** des fonctionnalités ajoutées.

---

## Documentation complémentaire

- **[`docs/API_ROUTES.md`](./docs/API_ROUTES.md)** — Routes API, stubs, handlers, exceptions.  
- **[`AGENTS.md`](./AGENTS.md)** / **[`CLAUDE.md`](./CLAUDE.md)** — Rappels Next.js / agents.

---

## Licence et contexte académique

Projet **PFE / académique** : le **mode démo facturation** permet de présenter les abonnements sans configuration Stripe complète. En production, utiliser des secrets hors dépôt, HTTPS, et valider les webhooks Stripe.

---

*Ce README a été structuré pour servir de base au mémoire / rapport : architecture, inventaire des dossiers, données, API et parcours. Vous pouvez y ajouter captures d’écran, diagrammes de cas d’usage et résultats de tests dans votre document final.*
