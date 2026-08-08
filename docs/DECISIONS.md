# Jrello — Decisions (ADR log)

Architecture Decision Records. Each entry is a deliberately small, opinionated record:
context, decision, consequences. Append-only. New decisions get the next number; never
edit a past ADR's *Decision* — supersede it with a new ADR that links back.

Statuses: `Proposed` · `Accepted` · `Superseded by ADR-00xx` · `Deprecated`.

---

## ADR-0001 — Authentication: email/password + GitHub OAuth, cookie sessions

**Status:** Superseded by ADR-0008 (2026-08-08)
**Date:** 2026-08-08

> **Superseded.** Kept verbatim for history. The project now uses Clerk (ADR-0008). The
> reasoning below is still a useful record of the self-managed alternative and what we
> give up by adopting Clerk.

### Context
Jrello is developer-first; users expect GitHub sign-in. But GitHub-only lock-in is
hostile to the indie/solo audience and to evaluation. We need an auth model that is secure
by default, simple to operate, and good for real-time (Socket.IO needs an authenticated
session, not a per-request token).

Options considered:
- **Auth-as-a-service (Clerk/Auth0/Supabase Auth):** fast to ship, but adds a vendor
  dependency, opaque session handling for Socket.IO, and pricing pressure as we grow. It
  also fights the "we own the developer tool" ethos.
- **Stateless JWT (access + refresh):** the default "modern" choice; adds refresh-token
  rotation, token storage on the client, CSRF/replay concerns, and complexity we don't
  need for an MVP.
- **Cookie sessions backed by a DB `Session` table:** simple, revocable, works natively
  with both Next.js Route Handlers and Socket.IO (same cookie), and the session is
  inspectable/auditable.

### Decision
- **Email/password + GitHub OAuth** as identity providers. One `User` may have either or
  both linked (via `Account`).
- **Server-side sessions** stored in a `Session` table; the cookie carries only the
  session id (hashed at rest). HTTP-only, `SameSite=Lax`, `Secure` in prod.
- **No client-side JWTs.** No refresh tokens.
- Passwords hashed with a modern slow hash (Argon2id preferred, bcrypt acceptable).
- Logout invalidates the `Session` row; idle expiry + absolute expiry enforced server-side.

### Consequences
- **+** One auth story for REST and Socket.IO (cookie on the upgrade request).
- **+** Sessions are trivially revocable (delete the row) — good for "log out everywhere."
- **+** No refresh-token/CORS/token-storage surface area.
- **−** Not stateless; every request hits the DB (or cache) for session lookup. Acceptable
  at MVP scale; mitigatable with an in-memory/Redis cache later without changing the model.
- **−** We own password reset/email verification flows (Phase 2 polish).

## ADR-0002 — Single Next.js deployable (no separate API service)

**Status:** Accepted
**Date:** 2026-08-08

### Context
Jrello needs a frontend, an HTTP API, and a WebSocket server. We could split these into
separate services (frontend repo + API repo + realtime service) or keep them in one
deployable.

### Decision
Ship a **single Next.js application** that contains the App Router UI, Route Handlers /
Server Actions for the API, and a Socket.IO server mounted on a Node HTTP server. One
codebase, one deploy.

### Consequences
- **+** Shared TypeScript types end-to-end (zod schemas, domain types).
- **+** One deploy, one set of env vars, one CI pipeline — operational simplicity.
- **+** Server Actions give RPC-like DX with no separate API contract to maintain.
- **−** Less "clean" layer separation; discipline required to keep `src/lib/api/` as the
  business-rule boundary so routes stay thin.
- **−** Real-time scales horizontally only with a Redis adapter later (ADR-0006). That is
  a future, additive change — it does not force a rewrite of the data layer.
- If background jobs become necessary, we add a worker process that imports the same
  domain modules — not a separate API.

## ADR-0003 — Prisma + PostgreSQL

**Status:** Accepted
**Date:** 2026-08-08

### Context
Need a primary store with strong consistency (issue numbers, sortOrder, memberships) and
an ORM that supports migrations, typed queries, and PostgreSQL-specific features (UUID,
partial indexes, JSON for narrowly-scoped payloads).

### Decision
- **PostgreSQL 15+** as the single source of truth.
- **Prisma** as the ORM. The `schema.prisma` is the canonical data model.
- **Migration-driven** schema changes only (`prisma migrate`); no `db push` in shared
  environments.
- Prisma client is a per-process **singleton** to survive dev hot-reload.
- Raw SQL escape hatch (`prisma.$queryRaw`) is allowed for complex/specialized queries
  (e.g., recursive issue ordering), with a code comment explaining why.

### Consequences
- **+** Excellent DX, type-safe queries, readable schema, reviewable migrations.
- **+** PostgreSQL features available when needed (exclusion constraints, generated cols).
- **−** Prisma's abstraction leaks on complex queries — we accept the raw escape hatch.
- **−** Schema-first means a doc/code drift risk; mitigated by "schema is canonical, docs
  follow" rule in `DATABASE.md`.

## ADR-0004 — UUID primary keys

**Status:** Accepted
**Date:** 2026-08-08

### Context
Choosing between sequential integers and UUIDs for PKs. Sequential IDs are compact and
index-friendly but enumerable and coupled to creation order (leaks volume info, enables
guessing). UUIDs are larger but opaque.

### Decision
All primary keys are **UUID v4** (`@id @default(uuid()) @db.Uuid`). Foreign keys match.
Human-readable identifiers (`JREL-142`, workspace slugs) are separate, validated,
unique-constrained fields — never the PK.

### Consequences
- **+** Safe to expose in URLs/API without leaking counts or enabling enumeration.
- **+** ID generation can move client-side or to a worker later without collision risk.
- **−** Larger indexes and rows vs int; negligible at MVP scale, measurable only later.
- **−** UUIDs sort randomly; we never rely on PK order for display — explicit
  `sortOrder` / `createdAt` ordering everywhere.

## ADR-0005 — Soft delete on user-authored content

**Status:** Accepted
**Date:** 2026-08-08

### Context
Issues/comments/projects get deleted by mistake; referential integrity (activity that
references a deleted comment) matters; GDPR requires a *real* purge path.

### Decision
- `deletedAt DateTime?` on `User`, `Workspace`, `Project`, `Issue`, `Comment`,
  `IssueStatus`.
- A reusable Prisma extension (or query helper) auto-applies `deletedAt: null` to reads
  and sets `deletedAt = now()` on `delete`.
- **Foreign keys are not cascade-deleted on soft delete** — references stay valid; the
  soft-deleted entity simply stops appearing.
- **Hard delete (true purge)** is a separate, audited, admin-triggered operation for
  GDPR/privacy only.

### Consequences
- **+** Undo is possible; nothing is lost to a misclick.
- **+** Activity/history stays referentially valid.
- **−** Every query carries the `deletedAt: null` filter (mitigated by the helper).
- **−** Unique constraints (e.g., slug, email) must account for soft-deleted rows —
  partial unique indexes where supported, or app-layer uniqueness checks.
- Issue numbers are **never reused**, even after soft delete.

## ADR-0006 — Socket.IO on the app process for the MVP

**Status:** Accepted
**Date:** 2026-08-08

### Context
Real-time is required for the board (Phase 6) and presence. We could run Socket.IO in the
Next.js process or as a separate service from day one.

### Decision
Run Socket.IO **on the same Node HTTP server as Next.js** for the MVP (separate dev
process `pnpm dev:socket`). Use sticky sessions behind the load balancer if needed.

### Consequences
- **+** Simplest possible ops story; one process, one set of env vars.
- **+** Shared domain modules emit events directly after commit — no inter-process bus.
- **−** Horizontal scaling requires the **Socket.IO Redis adapter** and/or sticky sessions
  later. That change is additive: swap the adapter, no data-layer rewrite.
- **−** A long-running socket connection in the same process as request handling means we
  must keep per-request work snappy (we should anyway).
- When we outgrow it, the realtime concern lifts out cleanly because the event contract
  (`REALTIME.md`) is stable and typed.

## ADR-0007 — TanStack Query for client server-state

**Status:** Accepted
**Date:** 2026-08-08

### Context
RSC fetches initial data, but mutations from the client (move card, edit field) need
optimistic update, invalidation, and cache coordination across views. Hand-rolling this
per feature is error-prone.

### Decision
Use **TanStack Query** for the subset of data that is mutated/invalidated from the client
(board columns, issue lists). RSC remains the path for first paint and read-only views.
Ephemeral UI state (panel open, selection) uses **Zustand** — never TanStack Query.

### Consequences
- **+** Optimistic updates + rollback + invalidation ergonomics out of the box.
- **+** Plays well with real-time: socket events invalidate/refetch the relevant query.
- **−** An extra runtime dependency and a second mental model (RSC fetch vs client cache).
  Mitigated by a clear rule: **the URL and the DB are the sources of truth; the cache is
  advisory.**

## ADR-0008 — Authentication via Clerk (supersedes ADR-0001)

**Status:** Accepted
**Date:** 2026-08-08
**Supersedes:** ADR-0001

### Context
ADR-0001 chose self-managed email/password + GitHub OAuth with DB-backed cookie sessions,
explicitly rejecting auth-as-a-service to avoid vendor lock-in and to keep Socket.IO auth
simple. On beginning implementation we revisited this for the MVP:

- Password reset, email verification, session revocation, "log out everywhere," and the
  GitHub OAuth flow are each real surfaces that cost weeks to do well and securely.
- At MVP scale we have no dedicated security capacity; an auth bug is a worst-case defect.
- Clerk (and peers) ship a hosted, audited auth UX, social + email + passkeys, and a
  webhook that lets us mirror a `User` row locally without owning credential storage.
- The earlier Socket.IO concern is real but bounded: Clerk issues a short-lived JWT
  session token that Socket.IO middleware can verify with Clerk's JWKS — additive wiring,
  not a blocker.

### Decision
- Use **Clerk** as the identity provider for sign-up / sign-in / session management.
- Clerk hosts the auth UI (sign-in, sign-up, account) and owns credentials. We store **no
  passwords** and run **no `Session` table** of our own.
- Keep a local **`User` mirror** row in Postgres, keyed by Clerk's `externalId`
  (the Clerk user id), synced from Clerk via the `user.created` / `user.updated` /
  `user.deleted` webhook. Local rows carry display data (name, avatar, email) for queries,
  foreign keys, and denormalized rendering — never credentials.
- `GitHub OAuth` continues to be available as a Clerk social connection (no separate
  OAuth code on our side).
- **API auth:** protected routes read the Clerk session (`await auth()`) → Clerk user id →
  resolve the local `User` mirror → `actor`.
- **Socket.IO auth:** verify the Clerk session JWT against Clerk's JWKS in the socket
  middleware; resolve the local `User` mirror from the token's `sub`.

### Consequences
- **+** Auth UX, MFA/passkeys, email verification, and social login ship immediately and
  stay patched by the vendor.
- **+** No credential storage on our side → smaller security surface and blast radius.
- **−** Vendor dependency and pricing; a Clerk outage is an auth outage. Mitigated by
  Clerk's reliability and by keeping our business data fully in our own Postgres (only
  identity depends on Clerk).
- **−** Extra webhook + mirror logic (`/api/webhooks/clerk`) and eventual-consistency
  between Clerk and our `User` table. Mitigated by lazy-create on first authenticated
  request if a mirror row is missing.
- **−** Socket.IO auth is one step more complex (JWT/JWKS verify) than reading a cookie
  session row. Acceptable; the event contract (`REALTIME.md`) is unaffected.
- **Data model impact:** `Account`, `Session`, `passwordHash`, and the OAuth-token fields
  are **dropped** from our schema (see `DATABASE.md` annotations). `User` remains, with a
  `clerkId` unique column. Full mirror lands in Phase 2.

---

## How to add a new ADR

1. Copy the template (Context / Decision / Consequences).
2. Number it next; never reuse a number.
3. Link related ADRs and docs (`ARCHITECTURE.md`, `DATABASE.md`, etc.).
4. If it reverses a past decision, set the old one to `Superseded by ADR-00xx` and explain
   in the new one.
5. Commit it with the change that motivated it, not after the fact.
