# Faymoos

Plateforme **Next.js** pour créer des **identités professionnelles** et des **capsules interactives** (parcours à choix multiples avec branches, CTA, portfolio et témoignages). Le projet inclut un **espace Studio** pour les affiliés, des **analytics**, des **recommandations** sur la page Explore, un module **facturation / abonnements** (Stripe ou mode démo PFE), et des assistants **IA** (OpenAI).

---

## Sommaire

1. [Stack technique](#stack-technique)  
2. [Installation](#installation)  
3. [Variables d’environnement](#variables-denvironnement)  
4. [Structure du dépôt](#structure-du-dépôt)  
5. [Fonctionnalités](#fonctionnalités)  
6. [API](#api)  
7. [Scripts npm](#scripts-npm)  
8. [Build & déploiement](#build--déploiement)  
9. [Documentation complémentaire](#documentation-complémentaire)

---

## Stack technique

| Domaine | Technologie |
|--------|-------------|
| Framework | **Next.js 16** (App Router, dossier `app/` à la racine) |
| UI | **React 19**, **Tailwind CSS 4** |
| Base de données | **PostgreSQL** via **Prisma 5** (client généré dans `src/generated/prisma`) |
| Auth session | Cookie HTTP-only `faymoos_session` (implémentation maison sur les routes login/register) |
| Paiements | **Stripe** (Checkout, portail client, webhooks) — optionnel si mode démo |
| IA | **OpenAI** (génération / amélioration de texte, insights) |
| Tests | **Vitest** (handlers sous `src/route-handlers/api/`) |

---

## Installation

```bash
git clone <url-du-depot>
cd faymoos
npm install
```

Créer un fichier **`.env`** à partir de [`.env.example`](./.env.example) et renseigner au minimum **`DATABASE_URL`**.

Appliquer les migrations et générer le client Prisma :

```bash
npx prisma migrate deploy
npx prisma generate
```

Lancer le serveur de développement :

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

**Comptes de démonstration (optionnel)** : un script de seed existe dans `prisma/seed.js` (utilisateur démo + contenu exemple). Vérifier la cohérence avec votre schéma avant exécution. Création d’un admin : `npm run admin:ensure` (voir `prisma/ensure-admin.js`).

---

## Variables d’environnement

Les variables courantes sont documentées dans **`.env.example`**. Résumé :

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Connexion PostgreSQL |
| `OPENAI_API_KEY` | Génération de capsules, amélioration de texte, insights IA (si absente, les routes IA renvoient une erreur explicite) |
| `NEXT_PUBLIC_APP_URL` | URL publique (redirections Stripe, liens) |
| `BILLING_DEMO_MODE` | `true` = activation d’abonnement **sans Stripe** (PFE / soutenance) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Paiement réel et webhooks (voir `.env.example`) |
| `BILLING_GRANDFATHER_AFFILIATES` | Optionnel : anciens affiliés sans abonnement Stripe conservent un accès type Studio si non désactivé |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Optionnel : e-mail au propriétaire lors d’un **nouveau commentaire** capsule (voir `src/lib/capsule-comment-notify.ts`) |
| `COMMENT_NOTIFY_EMAIL` | `false` pour désactiver l’e-mail même si Resend est configuré |

> Ne commitez jamais le fichier `.env` (secrets).

---

## Structure du dépôt

- **`app/`** — Routes App Router (pages, layouts) et **stubs** `app/api/**/route.ts` qui ré-exportent souvent les handlers.
- **`src/route-handlers/api/`** — **Implémentation** des routes API (logique métier, Prisma). Convention décrite dans [`docs/API_ROUTES.md`](./docs/API_ROUTES.md).
- **`src/lib/`** — Utilitaires (Prisma, auth, quotas facturation, accès Studio, thèmes Space, etc.).
- **`src/components/`** — Composants React réutilisables.
- **`src/modules/recommendation/`** — Service de recommandations (similarité texte, popularité, signaux invité).
- **`prisma/`** — `schema.prisma`, migrations, seeds.

---

## Fonctionnalités

### Authentification & comptes

- **Inscription** et **connexion** (`/register`, `/login`) avec hash **bcrypt** des mots de passe.
- **Déconnexion** (`/api/logout`).
- Rôles utilisateur : **`USER`**, **`AFFILIATE`** (Studio), **`ADMIN`**.
- Session via cookie **`faymoos_session`** (valeur = `userId` dans l’implémentation actuelle).

### Identités professionnelles

- Plusieurs **profils** par identité : nom, slug public, type (freelancer, agence, créateur, startup…), bio, headline, avatar, cover, thème visuel, liens sociaux (JSON).
- Options **premium** côté identité : masquer le branding Faymoos (`hideBranding`), **webhook HTTPS** sur clic CTA (`ctaWebhookUrl` + secret pour signatures).

### Capsules interactives

- Une **capsule** = titre + **question objectif** + **options** ; chaque option mène à une **branche** (headline, description, CTA, champ *proof*).
- CRUD via API : `/api/capsules`, `/api/options`, `/api/branches`.
- **Quotas** selon l’abonnement : nombre maximal d’**identités** et de **capsules** (voir `src/lib/subscription-guards.ts`).

### Affichage public

- Page capsule **`/capsule/[slug]`** : parcours interactif pour les visiteurs, suivi d’événements analytics, favoris (si connecté), envoi de **messages** au propriétaire, chatbot selon configuration.
- Liens portfolio / témoignages rattachés à l’identité.

### Space Wizard (éditeur d’expérience)

- **Templates** → **création** / **édition** de capsules avec preset visuel (`layoutPreset`), brouillon **`isPublished`**, **hotspots** éditeur (`editorHotspots` JSON), activation des **commentaires visiteurs** (onglet Settings, sauvegarde via `PUT /api/capsules`).
- Pages : `/dashboard/space/wizard/templates`, `.../create`, `.../edit/[capsuleId]`, prévisualisation `.../preview/[capsuleId]`.
- Thèmes : `src/lib/space-themes.ts`.

### Portfolio & témoignages

- CRUD **`/api/portfolio`**, **`/api/testimonials`** rattachés à une identité (projets avec image, année, visibilité ; avis clients avec rôle / entreprise).

### Médiathèque (Asset Library)

- Upload et gestion de **fichiers** utilisateur (images, vidéos, modèles 3D) via **`/api/upload`** et **`/api/assets`** (modèle `UserAsset`).

### Explore & recommandations

- Page **`/explore`** : découverte des identités ayant au moins une capsule ; filtres par type de profil.
- **`/api/explore`** et **`/api/recommendations`** : listes enrichies ; le service de recommandation combine **similarité textuelle**, **popularité** (sessions récentes) et signaux **invité / connecté** (`src/modules/recommendation/recommendation.service.ts`).

### Favoris

- Marquer des capsules favorites (`/dashboard/favorites`, **`/api/favorites`**).

### Messages & notifications

- Formulaire de contact sur les capsules → modèle **`Message`** ; tableau de bord **`/dashboard/messages`**, API **`/api/messages`**, export CSV **`/api/messages/export`** (droits propriétaire / Studio client selon les règles métier).
- **Notifications** in-app (`Notification`) : nouveaux messages, clics CTA, etc. — **`/api/notifications`**, cloche dans le layout dashboard.

### Commentaires sur les capsules

- Section publique en bas de **`/capsule/[slug]`** : lecture sans compte, envoi **nom + e-mail (optionnel) + message** ; seuls les commentaires **approuvés** sont visibles ; compteur d’activité, pas de likes.
- Modération : **`/dashboard/capsule-comments`** (onglets, désactivation par capsule via **`commentsEnabled`** sur **`PUT /api/capsules`**). API : **`/api/capsule-comments/moderate`**, liste des capsules gérées **`/api/capsule-comments/my-capsules`**, export **`/api/capsule-comments/export`**.
- Nouveau commentaire → notification **`NEW_CAPSULE_COMMENT`** ; e-mail optionnel (Resend, variables ci-dessus).

### Analytics

- **Sessions** et **événements** (`START`, `OPTION_CLICK`, `CTA_CLICK`) par capsule.
- **`/api/analytics`** (agrégats) et **`/api/analytics/track`** (enregistrement).
- Pages **`/dashboard/analytics`** et détail **`/dashboard/analytics/[capsuleId]`**.

### Espace Studio (affiliés)

- Rôle **`AFFILIATE`** : gestion de **clients liés** (`AffiliateClient`), **invitations** sécurisées par jeton haché (`StudioClientInvite`), acceptation via **`/invite/studio/[token]`**.
- API : **`/api/studio/clients`**, **`/api/studio/invites`**, verify, accept, inbox, **`/api/studio/metrics`**, export clients **`/api/studio/clients/export`**.
- **Quotas** selon plan : nombre de clients, invitations / mois, exports / mois ; accès Studio conditionné par l’**abonnement effectif** (ou règle *grandfather* affiliés).
- Un affilié peut agir sur les ressources de ses clients (**studio-access**).

### Facturation & abonnements

- **Plans** : FREE, PRO, STUDIO, STUDIO_PLUS — limites dans `src/lib/subscription-plans.ts`.
- **Données Stripe** sur `User` : customer, subscription, statut, plan déclaré, fin de période.
- **Tarifs affichés** stockés en base : table **`SubscriptionPlanPrice`** (montants mensuel / annuel en centimes).
- **Mode démo PFE** (`BILLING_DEMO_MODE=true` ou, en `next dev`, absence de `STRIPE_SECRET_KEY`) : **`POST /api/billing/demo-activate`** met à jour le plan sans paiement ; page **`/dashboard/billing`**.
- **Mode production** : **`POST /api/billing/checkout`**, **`POST /api/billing/portal`**, **`POST /api/webhooks/stripe`** pour synchroniser l’état d’abonnement.
- Compteurs mensuels **`SubscriptionUsage`** (exports Studio, etc.).
- **`GET /api/me`** inclut un objet **`billing`** (snapshot quotas / usage).

### Intelligence artificielle (OpenAI)

- **`POST /api/ai/generate-capsule`** : génère titre, objectif et options/branches en JSON.
- **`POST /api/ai/improve-text`**, **`POST /api/ai/insights`** : aide à la rédaction et analyse.

### Chatbot

- **`/api/chatbot`** — dialogue contextuel (selon implémentation ; peut s’appuyer sur OpenAI ou règles locales).

### Administration

- Pages **`/dashboard/admin`**, **`/dashboard/admin/users`**, **`/dashboard/admin/capsules`**.
- API **`/api/admin/users`**, **`/api/admin/capsules`**, **`/api/admin/stats`** (réservé au rôle **ADMIN**).

---

## API

La liste détaillée des routes, la convention **`app/api` → `src/route-handlers`**, et les fichiers **implémentés directement** sous `app/api/` sont décrits dans [**`docs/API_ROUTES.md`**](./docs/API_ROUTES.md).

Routes API notables (non exhaustif) :

- Auth : `login`, `register`, `logout`, `me`
- Contenu : `identity`, `capsules`, `options`, `branches`, `portfolio`, `testimonials`, `upload`, `assets`
- Social : `favorites`, `messages`, `notifications`, `explore`, `recommendations`, `chatbot`, `capsules/[id]/comments`, `capsule-comments/*`
- Analytics : `analytics`, `analytics/track`
- Studio : `studio/clients`, `studio/invites`, …
- Facturation : `billing/plans`, `billing/checkout`, `billing/portal`, `billing/demo-activate`, `webhooks/stripe`
- Admin : `admin/users`, `admin/capsules`, `admin/stats`
- IA : `ai/generate-capsule`, `ai/improve-text`, `ai/insights`

---

## Scripts npm

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement Next.js |
| `npm run build` | Build production (Turbopack par défaut sur Next 16) |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint |
| `npm test` | Vitest (suite unitaire) |
| `npm run admin:ensure` | Script utilitaire admin (Prisma) |

---

## Build & déploiement

- Après chaque changement de schéma : **`npx prisma migrate deploy`** (production) ou **`npx prisma migrate dev`** (développement).
- Si le **build Turbopack** échoue (ex. polices Google / réseau), essayer : **`npx next build --webpack`**.
- Config Next : `next.config.ts` (dont `turbopack.root`).

---

## Documentation complémentaire

- [**`docs/API_ROUTES.md`**](./docs/API_ROUTES.md) — structure des routes API et conventions.
- [**`AGENTS.md`**](./AGENTS.md) / **`CLAUDE.md`** — règles pour agents / Next.js du projet.

---

## Licence & contexte

Projet **PFE / académique** : le **mode démo facturation** permet de présenter les abonnements sans configuration Stripe complète. Pour un déploiement réel, configurer Stripe, les webhooks et les clés API de façon sécurisée.
