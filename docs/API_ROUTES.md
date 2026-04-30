# Routes API Faymoos — structure et conventions

## Règle générale

Next.js ne charge comme routes HTTP que les fichiers **`app/api/**/route.ts`** à la racine du dépôt (App Router à la racine, pas seulement sous `src/`).

Pour éviter de mélanger **l’arborescence Next** (`app/`) avec le **code métier** des handlers, la plupart des endpoints suivent ce modèle :

1. **`app/api/<segment>/route.ts`** — fichier **court** qui ré-exporte les handlers HTTP (`GET`, `POST`, etc.).
2. **`src/route-handlers/api/<segment>/route.ts`** — **implémentation** (logique Prisma, validation, réponses).

Import des implémentations : `@/route-handlers/api/...` (alias défini dans `tsconfig.json`).

L’alias historique `@/app/api/...` pointait en réalité vers `src/app/api/...` (car `@/*` → `src/*`), ce qui prêtait à confusion avec le vrai dossier **`app/api`** à la racine. Les handlers ont été déplacés vers **`src/route-handlers/api/`** pour séparer clairement :

| Emplacement | Rôle |
|-------------|------|
| `app/api/` | Déclaration des routes pour Next (souvent 1 ligne `export { ... } from "..."`). |
| `src/route-handlers/api/` | Code des handlers réutilisable / testable unitairement. |

## Handlers dans `src/route-handlers/api/` (ré-export depuis `app/api/`)

| Route HTTP | Fichier stub Next | Implémentation |
|------------|-------------------|----------------|
| `POST /api/login` | `app/api/login/route.ts` | `src/route-handlers/api/login/route.ts` |
| `POST /api/register` | `app/api/register/route.ts` | `src/route-handlers/api/register/route.ts` |
| `/api/capsules` | `app/api/capsules/route.ts` | `src/route-handlers/api/capsules/route.ts` |
| `/api/options` | `app/api/options/route.ts` | `src/route-handlers/api/options/route.ts` |
| `/api/branches` | `app/api/branches/route.ts` | `src/route-handlers/api/branches/route.ts` |
| `/api/identity` | `app/api/identity/route.ts` | `src/route-handlers/api/identity/route.ts` |
| `/api/portfolio` | `app/api/portfolio/route.ts` | `src/route-handlers/api/portfolio/route.ts` |
| `/api/testimonials` | `app/api/testimonials/route.ts` | `src/route-handlers/api/testimonials/route.ts` |
| `GET /api/analytics` | `app/api/analytics/route.ts` | `src/route-handlers/api/analytics/route.ts` |
| `POST /api/analytics/track` | `app/api/analytics/track/route.ts` | `src/route-handlers/api/analytics/track/route.ts` |
| `GET /api/recommendations` | `app/api/recommendations/route.ts` | `src/route-handlers/api/recommendations/route.ts` |
| `POST /api/ai/improve-text` | `app/api/ai/improve-text/route.ts` | `src/route-handlers/api/ai/improve-text/route.ts` |
| `POST /api/ai/insights` | `app/api/ai/insights/route.ts` | `src/route-handlers/api/ai/insights/route.ts` |
| `POST /api/ai/generate-capsule` | `app/api/ai/generate-capsule/route.ts` | `src/route-handlers/api/ai/generate-capsule/route.ts` |

## Implémentation directement sous `app/api/` (pas de miroir dans `route-handlers`)

Ces fichiers contiennent toute la logique ; ajouter un nouvel endpoint ici ne nécessite pas de dossier sous `src/route-handlers/api/` sauf si vous choisissez d’extraire la logique plus tard.

- `app/api/me/route.ts`
- `app/api/logout/route.ts`
- `app/api/upload/route.ts`
- `app/api/assets/route.ts`
- `app/api/favorites/route.ts`
- `app/api/notifications/route.ts`
- `app/api/messages/route.ts`
- `app/api/chatbot/route.ts`
- `app/api/explore/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/capsules/route.ts`
- `app/api/admin/stats/route.ts`

## Tests

Les tests Vitest importent les handlers depuis **`@/route-handlers/api/...`** pour cibler l’implémentation sans passer par les stubs.

## Ajouter une nouvelle route API

1. Si la logique est volumineuse ou partagée : créer `src/route-handlers/api/<nom>/route.ts` avec `GET` / `POST` / …  
2. Créer `app/api/<nom>/route.ts` avec :  
   `export { GET, POST } from "@/route-handlers/api/<nom>/route";`  
3. Si le handler reste très court (quelques lignes), vous pouvez tout mettre dans `app/api/<nom>/route.ts` et ne pas créer de fichier sous `route-handlers`.

## Note sur `src/app/`

Le dépôt peut encore contenir d’autres fichiers sous `src/app/` (ex. pages ou composants historiques). **L’App Router actif pour le site est `app/` à la racine.** Ne recréez pas `src/app/api/` — utilisez `src/route-handlers/api/` pour les handlers extraits.
