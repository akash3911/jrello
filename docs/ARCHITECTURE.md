# Jrello — Architecture

This document describes how Jrello is built end-to-end. It is the reference for where
code lives, how the parts talk to each other, and why the major decisions were made the
way they were. Specific technical decisions are recorded as ADRs in `DECISIONS.md`;
this document explains the *system*.

---

## High-level architecture

Jrello is a **single deployable Next.js application** that contains both the frontend
and the backend (API routes + a Socket.IO server). It talks to PostgreSQL via Prisma.

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser (client)                        │
│  Next.js RSC + Client Components · Tailwind · shadcn/ui       │
│  TanStack Query (server state) · Zustand (ephemeral UI state) │
└───────────────┬──────────────────────────┬────────────────────┘
                │ HTTPS (REST/API routes)   │ WebSocket (Socket.IO)
                ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│                  Next.js (single deployable)                  │
│  ┌────────────────────┐   ┌────────────────────────────────┐ │
│  │ App Router (RSC)   │   │ API layer                       │ │
│  │ Server components  │   │  · Route Handlers (REST)        │ │
│  │ + actions          │   │  · Server Actions (mutations)   │ │
│  └────────────────────┘   │  · Socket.IO server (custom srv)│ │
│                            └────────────────────────────────┘ │
│  Cross-cutting: auth session · validation (zod) · permissions │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────┐    ┌─────────────────────────────┐
│ PostgreSQL (Prisma ORM)  │    │ GitHub (OAuth + REST + WH)  │
│ Primary store of record  │    │ Phase 7+                    │
└──────────────────────────┘    └─────────────────────────────┘
```

**Why one deployable, not a separate API service?** For an MVP/early product, the
operational simplicity of one process outweighs the theoretical cleanliness of a split
backend. Next.js Route Handlers + Server Actions give us a typed RPC-like DX with no
separate API contract to maintain. If/when real-time or background work demands it, the
Socket.IO server and a worker process can be split out without rewriting the data layer.
(See ADR-0002.)

## Frontend architecture

- **Framework:** Next.js App Router (React Server Components by default).
- **Rendering strategy:** RSC for initial load and data fetch; client components only
  where interactivity is required (board, command palette, forms). No SPA-style
  client-side routing for primary navigation — the App Router handles it.
- **Server state:** TanStack Query for the subset of data that is mutated/invalidated
  from the client (board columns, issue lists). Server Components fetch directly via
  Prisma for first paint.
- **Client state:** Zustand for ephemeral UI state (selected card, panel open, command
  palette state). Nothing important lives only in client state — the URL is the source
  of truth for what's open/filtered.
- **URL as state:** Filters, selected issue, view mode are in the URL
  (`?view=board&assignee=me`). This makes everything shareable and back-button friendly.
- **Folder layout:**
  ```
  src/
    app/              # routes (App Router)
      (auth)/         # login/signup (outside shell)
      (app)/          # authenticated shell + nested routes
      api/            # route handlers (REST + webhooks)
    components/       # UI components
      ui/             # shadcn primitives (restyled)
      shell/          # app shell: sidebar, topbar, palette
      board/          # kanban
      issue/          # issue card, detail panel
    lib/              # non-UI logic
      api/            # server-side domain logic (db queries, permissions)
      auth/           # session, providers
      realtime/       # socket.io server + client hooks
      validation/     # zod schemas (shared w/ client)
      github/         # github client (Phase 7+)
    db/               # prisma client singleton + helpers
    styles/           # globals.css, tokens
    hooks/            # react hooks
    stores/           # zustand stores
    types/            # shared types
  ```
- **Data fetching pattern:** prefer RSC fetching for reads; use Server Actions /
  Route Handlers for writes. TanStack Query wraps mutations and optimistic updates.

## Backend architecture

The backend is **co-located** in the Next.js app. Logic is organized by **domain module**
under `src/lib/api/` (not by route), so business rules are reusable and testable
independently of HTTP:

```
src/lib/api/
  auth.ts          # sign-up, sign-in, session helpers
  workspaces.ts    # workspace CRUD + membership
  projects.ts      # project CRUD + membership
  issues.ts        # issue CRUD + status moves
  comments.ts
  sprints.ts       # Phase 5
  activity.ts      # writes Activity rows + emits events
  permissions.ts   # authorization helpers (canX(actor, resource))
  notifications.ts
```

Each module returns typed results and is the **only** place that touches Prisma for its
domain. Route Handlers / Server Actions are thin: parse input (zod) → check auth →
call domain module → return JSON.

### Request lifecycle (mutation example: move issue)

1. Client calls Server Action `moveIssue({ id, statusId, order })`.
2. Action validates with zod schema (shared with client).
3. Action resolves session → `actor`.
4. `permissions.canMoveIssue(actor, issue)` — denies with 403 if not a project member.
5. `issues.move(...)` runs in a Prisma transaction: update status/order, write an
   `Activity` row.
6. On commit, emit Socket.IO event `issue:moved` to the project room.
7. Return updated issue; client optimistic update is confirmed.

### Validation

- **zod** for all input, shared between client and server via `src/lib/validation/`.
- Never trust client-provided IDs/roles — always re-derive from the session.

### Error handling

- Domain functions throw typed errors (`AuthorizationError`, `NotFoundError`,
  `ValidationError`) that the API layer maps to HTTP status + JSON.
- Unexpected errors are logged with a request id; the client gets a generic message.

## PostgreSQL / Prisma architecture

- **PostgreSQL** as the single source of truth. JSON columns are avoided except for
  well-bounded cases (e.g., GitHub webhook payloads retained for audit).
- **Prisma** as the ORM. The schema (`prisma/schema.prisma`) is the canonical data model;
  `DATABASE.md` is its human-readable companion.
- **Migrations** via `prisma migrate`. Schema changes are always migration-driven, never
  `db push` in shared environments.
- **Connection pooling:** a single Prisma client instance (singleton pattern) per
  process to avoid exhausting connections in dev hot-reload.
- **UUIDs** (`@db.Uuid`) for all primary keys — opaque, no enumeration, safe to expose.
- **Soft delete:** `deletedAt Nullable(DateTime)` on user-visible content (issues,
  comments, projects). Hard delete is reserved for GDPR/privacy purges. Queries use a
  reusable `notDeleted` filter fragment.
- **Timestamps:** `createdAt`, `updatedAt` on every model.

See `DATABASE.md` for the full model and `DECISIONS.md` for the soft-delete and UUID
decisions (ADRs).

## Socket.IO architecture

Real-time is delivered via **Socket.IO**, run on a Node HTTP server that Next.js mounts.
In development this is a separate process (`npm run dev:socket`); in production it shares
the deployable or runs as a sidecar (see ADR-0006 when added).

### Rooms & authorization

- A client authenticates the socket with its session cookie/JWT on connect.
- On entering a project view, the client joins room `project:<projectId>`.
- All mutation events are broadcast to the relevant room by the domain layer.
- Presence is tracked per-room: "3 people viewing Board" with anonymous-but-labeled
  avatars (name + color).

### Event contract

Events are typed end-to-end (shared TS types in `src/lib/realtime/events.ts`). The
shape, direction, and payload of every event is documented in `REALTIME.md`. The
frontend never receives an untyped event.

### Reliability

- All real-time events are **best-effort notifications of state changes** — the database
  is the source of truth. On reconnect, the client refetches the current view rather
  than trusting a missed-event buffer. (We may add a small replay buffer later.)
- Optimistic UI means a dropped socket event never leaves the UI in a wrong state for
  the actor; other clients refetch on reconnect.

## GitHub integration architecture (Phase 7+)

- **OAuth:** GitHub as a data source via the GitHub App installation (per-repo token with
  repo scope). *Identity* sign-in via GitHub is handled by Clerk as a social connection,
  not by us. Installation tokens are short-lived and cached in-memory; we do not store
  long-lived user OAuth tokens.
- **App model:** a GitHub App (preferred) or OAuth App. A GitHub App gives per-repo
  granularity and webhook delivery without personal tokens.
- **REST + GraphQL:** we use the REST v3 API for simplicity; move to GraphQL only where
  N+1 calls become painful (e.g., fetching CI statuses for a board).
- **Association model:** an issue can be linked to ≥1 branch and ≥1 PR. Linking is
  either explicit (user clicks *Associate branch*) or detected from commit/PR messages
  matching the issue key (`JREL-142`).
- **Caching:** GitHub data (CI status, PR state) is cached in our DB with a short TTL
  and refreshed by webhook; we never block a UI render on a live GitHub call.

See `GITHUB-INTEGRATION.md`.

## Webhook architecture (Phase 7+)

- **Inbound:** GitHub → Jrello. A single `/api/webhooks/github` route verifies the
  signature, fans out to a handler per event type (`push`, `pull_request`,
  `check_suite`, `deployment_status`), updates our DB, and emits Socket.IO events.
- **Idempotency:** webhook deliveries are de-duplicated by GitHub delivery ID; we store
  the last N delivery IDs to make handlers idempotent.
- **Outbound (future):** Slack/email notifications are queued, not sent inline.

Webhook handlers are **thin**: verify → enqueue/transaction → emit. Heavy work is
deferred so GitHub sees fast 2xx responses.

## Authentication & authorization

- **Authentication:** chosen in ADR-0008 (supersedes ADR-0001). Summary: **Clerk** hosts
  sign-up / sign-in / social (incl. GitHub) / sessions. Clerk owns credentials; we store
  none. A local `User` mirror row in Postgres is synced from Clerk via webhook
  (`/api/webhooks/clerk`) and keyed by the Clerk user id (`clerkId`).
- **Resolving the actor:** protected route handlers and Server Actions call
  `await auth()` (from `@clerk/nextjs/server`) → Clerk user id → look up the local
  `User` mirror → `actor`. Never trust a client-supplied user id.
- **Socket.IO:** the socket middleware verifies the Clerk session JWT against Clerk's
  JWKS to resolve `userId`, then re-checks project membership as before.
- **Authorization model:** role-based at two levels:
  - **Workspace roles:** `OWNER`, `ADMIN`, `MEMBER`.
  - **Project roles:** `ADMIN`, `MEMBER`, `VIEWER` (per-project override of workspace
    membership).
- Every domain function takes the `actor` and calls `permissions.can*(actor, ...)`. The
  UI hides actions the user can't take, but the API always re-checks.

## Docker architecture

- **Local dev:** `docker-compose.yml` provides Postgres (+ pgAdmin optional). The Next.js
  app runs on the host in dev for fast HMR. (Docker Desktop may be absent on some dev
  machines — a local Postgres works identically; see `README` setup.)
- **Production image:** a multi-stage Dockerfile builds the Next.js app and runs it
  standalone. Postgres is **external** (managed) in production — we do not run our own
  DB container in prod.
- The Socket.IO server runs in the same container/process as Next.js for the MVP.

## Deployment architecture (Phase 9)

- **Target:** a single container behind a load balancer with sticky sessions (required
  only if Socket.IO is in-process; if we move to a Redis adapter, sticky sessions are
  unnecessary).
- **Managed Postgres** (Neon/Supabase/RDS) with point-in-time backups.
- **Assets:** served by the platform (or CDN) — not from the app container.
- **Environment:** all config via env vars; no secrets in the image. `.env.example`
  documents every variable.
- **CI/CD:** GitHub Actions — lint, typecheck, test, build, deploy on merge to `main`.
- **Observability (minimum):** structured logs (JSON) to stdout; an error boundary with
  request-id correlation. Full APM is post-MVP.

## Major technical decisions & tradeoffs

| # | Decision | Tradeoff | Where |
|---|----------|----------|-------|
| 1 | Authentication via Clerk (hosted) | Vendor dependency + webhook mirror; ships secure auth UX fast, no credential storage. Supersedes self-managed sessions. | ADR-0008 (supersedes ADR-0001) |
| 2 | Single Next.js deployable (no separate API) | Less "clean" separation; gained operational simplicity + shared types. | ADR-0002 |
| 3 | Prisma + PostgreSQL | Prisma raw-SQL escape hatch needed for complex queries; great DX + migrations. | ADR-0003 |
| 4 | UUID PKs | Larger indexes; opaque, safe-to-expose, no enumeration. | ADR-0004 |
| 5 | Soft delete on content | More query complexity; enables undo + audit + safe foreign keys. | ADR-0005 |
| 6 | Socket.IO on the app process (MVP) | Horizontal scale needs Redis adapter later; simplest path now. | ADR-0006 |
| 7 | TanStack Query for client server-state | Extra lib; gives optimistic update + invalidation ergonomics. | ADR-0007 |

Each is expanded in `DECISIONS.md`. (Row 1 was ADR-0001; superseded by ADR-0008 — Clerk.)
