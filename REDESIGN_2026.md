# Faymoos 2026 — Premium Web Redesign + RBAC v2

## Goal
This upgrade makes Faymoos easier to understand as a desktop-first web product while preserving the PFE business scope: multi-identity profiles, portfolio, proof, decision capsules, analytics and AI assistance.

## Core palette
The product shell is reduced to one neutral dark, one neutral light and one accent:
- Obsidian: `#0B0D10`
- Ivory: `#F7F4EE`
- Champagne: `#C6A15B`

Opacity variants of those tokens are used for borders, hover states and depth. Legacy violet, blue, green, pink and red interface accents were normalized to the champagne system so status and actions no longer look like unrelated products stitched together.

## Information architecture
The dashboard is grouped by user intent rather than by implementation detail:
1. Workspace — Overview, Identities, Capsules, Space Builder
2. Grow — Analytics, Messages, Comments, Favorites
3. Library & account — Media, Badges, Billing
4. Studio — permission-gated affiliate workspace
5. Administration — permission-gated platform operations

The layout is desktop-first with a persistent sidebar and calmer content density, while keeping a responsive mobile fallback.

## Functional scope retained and clarified
The project includes:
- authentication and account sessions
- multiple identity profiles
- portfolio and testimonials
- decision capsules with options, branches, proof and CTA
- public capsule viewer and visitor tracking
- analytics
- AI text/capsule/insight endpoints
- media library
- messages, favorites and comments
- badges and Faymoos score
- billing and subscription plans
- Studio / affiliate workspace
- administration and moderation

## RBAC v2
Authorization is now permission-based rather than scattered `role === ...` checks.

Roles: `USER`, `AFFILIATE`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.

The upgrade adds:
- centralized role/permission policy
- secure opaque server-side sessions instead of a raw user-id cookie
- account status (`ACTIVE` / `SUSPENDED`)
- role hierarchy protections
- Super Admin-only destructive user deletion
- protection against removing the last active Super Admin
- immediate session revocation on suspension
- server-side route guards for Studio and Administration
- API-level permission checks for creator, AI, analytics, media, messaging, comments and billing modules
- ownership checks for user content and delegated Studio access
- private handling of unpublished capsule drafts
- security/audit log and an Access Control screen

See `docs/RBAC_V2.md` for the complete matrix and deployment notes.

## Run locally after the RBAC migration
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run admin:ensure
npm run dev
```

At minimum configure `DATABASE_URL`. AI requires `OPENAI_API_KEY`; Stripe requires the Stripe variables already documented in the project.

Because the session format changed, previously logged-in browsers must authenticate again after deployment.

## Validation note
The packaging environment did not complete a full dependency installation within its execution window. The source is therefore shipped without `node_modules` or generated Prisma artifacts; `npm install` / `prisma generate` reconstruct them locally. JavaScript syntax checks and a TypeScript/TSX parser pass are performed before packaging, but a full `next build` must still be run in the target environment with its database/environment variables.
