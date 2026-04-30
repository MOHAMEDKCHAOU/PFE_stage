<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**API routes:** HTTP handlers live under `app/api/**/route.ts`. Shared implementations are in `src/route-handlers/api/**` and imported via `@/route-handlers/...` — see `docs/API_ROUTES.md`. Do not add `src/app/api/` again (ambiguous with root `app/api`).
<!-- END:nextjs-agent-rules -->
