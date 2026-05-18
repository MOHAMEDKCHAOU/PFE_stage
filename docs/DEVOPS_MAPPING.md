# Mapping Fonctionnalités ↔ DevOps — Faymoos

Ce document relie les **modules fonctionnels** de Faymoos aux pratiques **DevOps** (CI/CD, Docker, tests, données).  
Les mentions **« dans ce dépôt »** décrivent l’état **réellement versionné** ; les mentions **« cible / production »** correspondent à une **périmètre d’évolution** cohérent avec un mémoire (monitoring avancé, déploiement multi-environnements, etc.).

---

## Référentiel technique dans le dépôt

| Élément | Contenu |
|--------|---------|
| **CI GitLab** | `.gitlab-ci.yml` : `lint:ci` → `npm test` (Vitest) → `npm run build` (pas de job de déploiement ni de staging automatisé dans le fichier). |
| **Lint** | `npm run lint:ci` cible `src/route-handlers`, `src/__tests__`, `app/api` (garde-fou sur handlers et stubs API). |
| **Tests Vitest** | Fichiers sous `src/__tests__/api/` : `login`, `register`, `identity`, `capsules`, `options`, `branches`, `public-capsule-comments`. |
| **Docker** | `Dockerfile` + `docker-compose.yml` : PostgreSQL persisté (`faymoos_pgdata`), service `migrate` (`prisma migrate deploy`), service `app` (Next.js *standalone*). Pas de volume dédié aux **uploads** dans le compose actuel. |
| **Secrets** | Injectés via variables d’environnement (fichier `.env` en local, `environment` dans Docker / GitLab), jamais committés. |

---

## Authentification & gestion des comptes

**Fonctionnel** : inscription, connexion, déconnexion, rôles (`USER` / `AFFILIATE` / `ADMIN`), session cookie HTTP-only.

**DevOps — dans ce dépôt**

- **Tests Vitest** : handlers `/api/login` et `/api/register` (`login.test.ts`, `register.test.ts`).
- **Lint ESLint** : `lint:ci` inclut les stubs `app/api` et les handlers concernés.
- **Build Next.js** : étape `build` du pipeline ; pages d’auth compilées avec le reste de l’App Router.
- **Docker** : secrets et configuration via `app.environment` dans `docker-compose.yml` (à enrichir en prod : cookies `secure`, URL publique, etc.).

**Cible / production (mémoire)**

- Politiques GitLab (protected branches, déploiement manuel ou par rôle).
- Rotation des secrets et durcissement des cookies en HTTPS.

---

## Gestion des identités professionnelles

**Fonctionnel** : CRUD identités, bio, avatar, liens, portfolio, témoignages, slug unique.

**DevOps — dans ce dépôt**

- **Tests Vitest** : `identity.test.ts` sur le handler `/api/identity`.
- **Migrations Prisma** : évolution du modèle `IdentityProfile` versionnée sous `prisma/migrations/` ; appliquée au démarrage Docker via le service `migrate`.
- **Build** : pages dynamiques (`force-dynamic` où nécessaire) ; pas d’accès DB pendant `next build` pour la home / capsules publiques configurées ainsi.
- **Fichiers uploadés** : aujourd’hui **pas de volume Docker** pour avatars / covers dans `docker-compose.yml` — en déploiement, prévoir un **volume nommé** ou un **stockage objet** (S3, etc.).

**Cible / production**

- Sauvegardes médias + stratégie de purge.

---

## Capsules interactives & Space Wizard

**Fonctionnel** : capsules à options et branches, Space Wizard (création / édition).

**DevOps — dans ce dépôt**

- **Tests Vitest** : `capsules.test.ts`, `options.test.ts`, `branches.test.ts`.
- **Migrations** : modèles `Capsule`, `CapsuleOption`, `CapsuleBranch` versionnés en Prisma ; `migrate deploy` au lancement Compose.
- **Build** : compilation des pages dashboard / wizard avec le pipeline `build`.

**Cible / production**

- **Zero-downtime** : stratégie de déploiement (plusieurs réplicas, healthchecks, rolling update) — **non configurée** dans ce dépôt ; à documenter côté hébergeur (Kubernetes, Swarm, PaaS).

---

## Analytics & suivi de parcours

**Fonctionnel** : sessions, événements, dashboard analytics.

**DevOps — dans ce dépôt**

- **Migrations** : tables de suivi liées aux modèles analytics dans le schéma Prisma / migrations.
- **Qualité code** : typage renforcé sur `src/route-handlers/api/analytics/route.ts` (lint `lint:ci`).

**À compléter**

- **Tests Vitest** dédiés `/api/analytics` et `/api/analytics/track` : **non présents** dans `src/__tests__/` à ce jour.
- **Monitoring temps réel**, **logs centralisés** : **hors dépôt** (outil APM, ELK, Grafana, etc.) — pertinents dans le mémoire comme **architecture cible**.

---

## Commentaires & modération

**Fonctionnel** : commentaires publics, statuts de modération, e-mail optionnel (Resend).

**DevOps — dans ce dépôt**

- **Tests Vitest** : `public-capsule-comments.test.ts`.
- **Migrations** : modèle `CapsuleComment` et statuts dans l’historique Prisma.
- **Docker / secrets** : `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, etc. injectables via `environment` (voir `.env.example` / README).

**Cible / production**

- **Alerting** anti-spam (seuils, rate limiting, file d’attente) — à spécifier au niveau **infra / WAF / API gateway**.

---

## Médiathèque & assets

**Fonctionnel** : upload et gestion d’assets depuis le dashboard.

**DevOps — dans ce dépôt**

- **Build** : contrôle TypeScript global (`tsc` / build Next) sur les modules d’upload référencés par l’app.
- **Volume persistant uploads** : **non défini** dans le `docker-compose` actuel — **recommandation** pour un mémoire : documenter un bind mount (ex. `./public/uploads` ou répertoire dédié) ou un stockage externe.

**Cible / production**

- Surveillance **espace disque** et quotas par utilisateur / plan.

---

## Messages, favoris & notifications

**Fonctionnel** : messages, export CSV, favoris, notifications in-app.

**DevOps — dans ce dépôt**

- **Migrations** : modèles `Message`, `Favorite`, `Notification` dans le schéma et les migrations.
- **Build** : compilation des composants client (ex. cloche notifications) via l’étape `build`.

**À compléter**

- **Tests Vitest** sur handlers messages / notifications : **non listés** dans `src/__tests__/api/` à ce jour.

**Cible / production**

- Monitoring du volume de notifications et alertes sur pics anormaux.

---

## Chatbot & intelligence artificielle

**Fonctionnel** : chatbot capsule, routes OpenAI (génération, amélioration, insights).

**DevOps — dans ce dépôt**

- **Secrets** : `OPENAI_API_KEY` (Docker / GitLab CI variables / `.env`), non committée.
- **Build** : routes `/app/api/ai/**` compilées ; pas de tests Vitest dédiés dans le dossier des tests API actuels.

**Cible / production**

- Monitoring latence / quota OpenAI, alerting sur taux d’erreur.

---

## Badges & score de crédibilité

**Fonctionnel** : badges auto / admin, score Faymoos, affichage public.

**DevOps — dans ce dépôt**

- **Migrations** : `BadgeDefinition`, `UserBadge`, etc. (voir migration badges dans l’historique Prisma).
- **Runtime** : `ensureBadgeDefinitions()` et `computeFaymoosScore` sont utilisés depuis la logique métier (ex. routes admin badges, synchronisation auto — voir `src/lib/faymoos-badges.ts`) ; **pas** d’étape Docker dédiée « au démarrage du conteneur » pour `ensureBadgeDefinitions` dans le `Dockerfile` / `CMD` actuel.
- **Build** : pages et composants badges inclus dans `next build`.

**À compléter**

- Test Vitest **explicite** sur `computeFaymoosScore` : **absent** ; possible ajout dans `src/__tests__/`.

**Cible / production**

- Job d’init ou tâche planifiée si vous imposez une synchro des définitions avant trafic.

---

## Studio affilié

**Fonctionnel** : clients, invitations, métriques, exports CSV/PDF, quotas.

**DevOps — dans ce dépôt**

- **Migrations** : `AffiliateClient`, `StudioClientInvite`, `SubscriptionUsage`, etc.
- **Secrets e-mail** : comme pour les autres modules (Resend).
- **Build** : pages Studio et dépendance `jspdf` vérifiées par la compilation.

**À compléter**

- **Tests Vitest** handlers `/api/studio/*` : **non présents** dans le jeu de tests actuel.

---

## Facturation & abonnements

**Fonctionnel** : plans, Checkout Stripe, portail, webhooks, `BILLING_DEMO_MODE`.

**DevOps — dans ce dépôt**

- **Variables** : `STRIPE_*`, `BILLING_DEMO_MODE` injectables en Docker / CI.
- **Build** : vérifie la cohérence TypeScript des routes billing référencées.
- **Compose local** : `BILLING_DEMO_MODE=true` par défaut pour démarrage sans Stripe complet.

**À compléter**

- **Tests automatisés** des handlers `/api/billing/*` : **non présents** dans Vitest à ce jour.
- **Alerting webhooks** : cible prod (monitoring + retry Stripe Dashboard / logs applicatifs).

---

## Administration globale

**Fonctionnel** : utilisateurs, capsules, stats, modération.

**DevOps — dans ce dépôt**

- **CI** : même pipeline **lint → test → build** pour toute la branche ; les **règles GitLab** (qui peut merger / déployer) sont **à configurer** sur le projet GitLab, pas dans ce dépôt.

**Cible / production**

- Logs d’audit admin centralisés, sauvegardes PostgreSQL planifiées, tableaux de bord infra — **hors code applicatif**, à traiter dans l’**hébergeur** ou un **runbook** de mémoire.

---

## Synthèse pour le rapport

| Levier DevOps | Couverture actuelle dans le dépôt |
|---------------|-----------------------------------|
| Pipeline GitLab (lint, test, build) | Oui (`.gitlab-ci.yml`) |
| Docker Compose (app + DB + migrate) | Oui |
| Vitest sur handlers critiques | Partiel (auth, identité, capsules, options, branches, commentaires publics) |
| Migrations Prisma automatisées (Compose) | Oui (service `migrate`) |
| Volumes uploads | À ajouter / documenter pour prod |
| Monitoring, alerting, logs centralisés, zero-downtime, backups | Cible documentaire / infra |

Pour le **mémoire**, vous pouvez présenter le tableau ci-dessus comme **état actuel**, et les bullets « cible / production » comme **feuille de route** ou couche **NFR** (non-fonctionnelle) alignée avec votre hébergement réel.
