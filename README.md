# Faymoos — Plateforme d’identités professionnelles et de capsules interactives

Document destiné au **rapport de PFE** : description détaillée du dépôt, de l’architecture, des dossiers, des modèles de données et des fonctionnalités. **Faymoos** est une application web **Next.js** qui permet de créer des **identités professionnelles** (profils publics) et des **capsules** à choix multiples (branches, CTA, preuves), avec **Studio** pour affiliés, **analytics**, **Explore / recommandations**, **facturation** (Stripe ou mode démo), **IA** (OpenAI), **commentaires modérés**, **médiathèque**, et un système de **badges & score de crédibilité Faymoos**.



## Stack technique

| Domaine | Technologie |
|--------|-------------|
| Framework | **Next.js 16** (App Router — dossier `app/` à la racine du dépôt) |
| UI | **React 19**, **Tailwind CSS 4** |
| Base de données | **PostgreSQL** via **Prisma 5** (client généré dans `src/generated/prisma`) |
| Auth | Session opaque HTTP-only **`faymoos_session_v2`**, hash SHA-256 côté DB + RBAC permissions (`src/lib/auth.ts`, `src/lib/rbac-policy.ts`) |
| Paiements | **Stripe** (Checkout, portail client, webhooks) — contournable en mode démo |
| IA | **OpenAI** (génération/amélioration de texte, insights) |
| Validation / API | **Zod** (où utilisé dans les handlers), handlers testables |
| Tests | **Vitest** (`src/__tests__/`) |
| PDF (Studio) | **jspdf** (export clients, voir `src/lib/studio-clients-pdf.ts`) |
| QR | **qrcode** (workflows type scan, voir `ScanCaptureWorkflow`) |

**Note** : `next-auth` est listé dans `package.json` ; l’authentification effective du projet repose sur les routes **`/api/login`** et **`/api/register`**, une session serveur opaque et la politique RBAC décrite dans **`docs/RBAC_V2.md`**.

### RBAC v2

Les rôles applicatifs sont `USER`, `AFFILIATE`, `MODERATOR`, `ADMIN` et `SUPER_ADMIN`. Les routes protégées utilisent des **permissions serveur** (pas seulement la visibilité du menu), les comptes peuvent être `ACTIVE` ou `SUSPENDED`, et les opérations privilégiées sont journalisées dans `AuditLog`. Le détail de la matrice, de la hiérarchie et de la migration se trouve dans [`docs/RBAC_V2.md`](./docs/RBAC_V2.md).

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

-

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

*Ce README a été structuré pour servir de base au mémoire / rapport : architecture, inventaire des dossiers, données, API et parcours. Vous pouvez y ajouter captures d’écran, diagrammes de cas d’usage et résultats de tests dans votre document final.*

---

## Premium 2026 integrated release

The latest integrated architecture, Smart 360 workflow, AI lab/service, monetization notes and setup instructions are documented in [`docs/FINAL_RELEASE_2026.md`](docs/FINAL_RELEASE_2026.md).
