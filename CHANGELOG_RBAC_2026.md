# Faymoos Premium RBAC 2026 — implementation summary

## Security and authorization
- Added centralized RBAC roles and permission policy.
- Added `MODERATOR` and `SUPER_ADMIN` roles while preserving `USER`, `AFFILIATE`, `ADMIN`.
- Added account status: `ACTIVE` / `SUSPENDED`.
- Replaced raw user-id session cookie with opaque 32-byte server-side sessions stored as SHA-256 hashes.
- Added session revocation on logout and suspension.
- Added server-side `/dashboard` guard plus Studio/Admin section guards.
- Added API permission checks for identities, portfolio, testimonials, capsules, branches, options, analytics, AI, assets, upload, messages, comment moderation and billing.
- Retained object ownership checks for own content and delegated Studio clients.
- Prevented public capsule list from exposing unpublished drafts.
- Added role hierarchy rules and protected privileged roles from normal admins.
- Restricted destructive user deletion to `SUPER_ADMIN`.
- Prevented self-demotion, self-suspension and self-deletion.
- Prevented demotion, suspension or deletion of the last active `SUPER_ADMIN`.
- Hardened Studio delegation so removing `studio:access` revokes delegated access immediately.
- Updated old direct `ADMIN`/`AFFILIATE` checks to use the central policy in security-sensitive paths.
- Added `AuditLog` and restricted audit API/UI.
- Hardened `admin:ensure` so rerunning it does not reset an existing password unless `ADMIN_PASSWORD` is explicitly supplied.

## UX / administration
- Added role-aware sidebar navigation.
- Added clean Admin Overview.
- Rebuilt Users & Roles management.
- Added account suspension/reactivation controls.
- Added Access Control role matrix.
- Added recent security activity panel.
- Added clean permission-aware quick links.

## Visual refinement
- Kept the UI around three core tokens only: Obsidian `#0B0D10`, Ivory `#F7F4EE`, Champagne `#C6A15B`.
- Normalized old violet/blue/green/red/pink accents to Champagne or neutral opacity variants.
- Fixed gold-on-gold CTA/status contrast created by legacy components.
- Kept the application desktop-first and responsive rather than copying the mobile mockup literally.

## Database
Migration `20260913124000_rbac_sessions_audit` adds:
- `User.status`
- `AuthSession`
- `AuditLog`

See `docs/RBAC_V2.md` for the permission matrix and deployment steps.
