# Faymoos RBAC v2 — roles, permissions and secure sessions

This version replaces scattered role checks with one permission policy in `src/lib/rbac-policy.ts`.
The API remains responsible for authorization. Hiding a menu item is only a UX convenience and never the security boundary.

## Roles

| Role | Purpose | Key access |
|---|---|---|
| `USER` | Creator | Own identities, portfolio, testimonials, capsules, analytics, AI, assets, messages, comments and billing |
| `AFFILIATE` | Studio / affiliate | Creator access + delegated Studio client management |
| `MODERATOR` | Trust & moderation | Creator access + platform stats, capsule moderation, badge management and audit trail |
| `ADMIN` | Platform administrator | Moderator access + user listing, status changes and non-privileged role assignment |
| `SUPER_ADMIN` | Security owner | Every permission, including user deletion and privileged role/security actions |

`ADMIN` deliberately cannot assign `ADMIN` / `SUPER_ADMIN`, modify protected admin accounts, or delete users. Those destructive/high-privilege actions are reserved for `SUPER_ADMIN`.

## Permission groups

### Creator workspace
- `dashboard:view`
- `identity:read`, `identity:create`, `identity:update`, `identity:delete`
- `portfolio:manage`
- `testimonials:manage`
- `capsules:manage`, `capsules:publish`
- `analytics:read`
- `ai:use`
- `assets:manage`
- `messages:manage`
- `comments:moderate`
- `billing:manage`

### Studio
- `studio:access`
- `studio:clients:manage`

### Platform operations
- `admin:stats:read`
- `admin:users:read`
- `admin:users:write`
- `admin:capsules:moderate`
- `admin:badges:manage`
- `admin:audit:read`

### Security / destructive access
- `admin:users:delete`
- `admin:security:manage`

## Authorization rules implemented

1. **Server-side permissions first.** Protected API routes call `requirePermission(...)`; they do not trust sidebar visibility or a role sent by the browser.
2. **Ownership is still required.** Creator/Studio content APIs combine permission checks with `canManageIdentityAsOwner(...)`, preventing cross-account IDOR access.
3. **Studio delegation is live.** A linked client can be managed only while the affiliate account is `ACTIVE` and still has `studio:access`. Downgrading the account immediately removes delegated access.
4. **Draft capsules stay private.** Public capsule listing only returns `isPublished = true`; owners and authorized Studio delegates can retrieve drafts.
5. **Suspension is immediate.** A suspended user is rejected by session validation and all of that user's active sessions are revoked when an administrator suspends the account.
6. **Hierarchy is enforced.** `ADMIN` can manage `USER`, `AFFILIATE` and `MODERATOR`, but not `ADMIN` or `SUPER_ADMIN`. `SUPER_ADMIN` has the privileged management path.
7. **Self-lockout protection.** An administrator cannot change its own role, suspend itself, or delete itself from the account-management screen.
8. **Last Super Admin protection.** The last active `SUPER_ADMIN` cannot be demoted, suspended or deleted.
9. **Auditing.** Authentication and privileged administration events are stored in `AuditLog` and exposed only to users with `admin:audit:read`.

## Session security

The legacy cookie contained a raw user UUID. RBAC v2 replaces that mechanism with an opaque server-side session:

- browser cookie: `faymoos_session_v2`
- random 32-byte token
- browser stores the raw token only
- PostgreSQL stores only the SHA-256 token hash
- HTTP-only cookie
- `SameSite=Strict`
- `Secure` in production
- 7-day expiry
- per-session revocation and per-user revocation
- suspended accounts are denied on every session lookup

The previous `faymoos_session` cookie is explicitly removed on login/logout. Existing users therefore need to sign in again after deploying RBAC v2.

## Database migration

Migration: `prisma/migrations/20260913124000_rbac_sessions_audit/migration.sql`

It adds:
- `User.status`
- `AuthSession`
- `AuditLog`

For an existing database:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run admin:ensure
npm run dev
```

For local development where migrations are created/applied interactively, `npx prisma migrate dev` can be used instead of `migrate deploy`.

`npm run admin:ensure` now bootstraps the configured administrator as `SUPER_ADMIN` so there is a recovery/security owner after migration.

## Main implementation files

- `src/lib/rbac-policy.ts` — canonical roles and permission matrix
- `src/lib/auth.ts` — secure sessions and permission helpers
- `src/lib/studio-access.ts` — owner/delegated Studio authorization
- `src/lib/audit.ts` — privileged-event audit logging
- `app/api/admin/users/route.ts` — role hierarchy, suspension and deletion controls
- `app/api/admin/audit/route.ts` — restricted audit feed
- `app/(dashboard)/dashboard/admin/access/page.tsx` — human-readable access matrix and audit activity
