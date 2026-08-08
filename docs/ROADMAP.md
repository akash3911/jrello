# Jrello — Roadmap

This roadmap breaks Jrello into **nine phases**. Each phase has a single goal and a set of
**small, independently testable tasks**. A task is done when it is implemented, passes the
relevant type-check / lint / test, and matches the documented design direction
(`DESIGN-SYSTEM.md`, `UX.md`).

Rules that apply to every task — see `AI-BUILD-RULES.md` for the full set:

- One target per task. Don't drag unrelated changes along.
- Inspect the existing implementation before changing it. Preserve the design system.
- Run `pnpm typecheck`, `pnpm lint`, and relevant tests after every change.
- Update docs (`DECISIONS.md` at minimum) if a task changes an architectural decision.

Legend: ✅ MVP scope (Phases 1–4). 🔜 Post-MVP. Each task is sized to be reviewable on its own.

---

## Phase 1 — Foundation ✅

**Goal:** A running Next.js app with the toolchain, design tokens, and an empty app shell.
No business logic yet. Everything later depends on this being right.

| #   | Task                                                      | Done when                                                                 |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1.1 | Initialize Next.js (App Router) + TypeScript + pnpm       | `pnpm dev` serves a page; `tsconfig` strict.                              |
| 1.2 | Configure Tailwind + shadcn/ui base                       | Tailwind reads design tokens; shadcn init; `button`/`input` restyled.     |
| 1.3 | Implement design tokens (`globals.css` + `tailwind.config`) | Light/dark CSS vars from `DESIGN-SYSTEM.md`; `/dev` renders samples.    |
| 1.4 | Configure ESLint + Prettier + typecheck scripts           | `pnpm lint`, `pnpm typecheck`, `pnpm format` work clean.                  |
| 1.5 | Configure Prisma + PostgreSQL (local) + `db` scripts      | `prisma/schema.prisma` skeleton; `pnpm db:migrate` runs.                  |
| 1.6 | Env structure + `.env.example`                            | Every var documented; `src/lib/env.ts` validates at boot.                 |
| 1.7 | App shell skeleton (sidebar, topbar, content area)        | Static shell renders; dark/light toggle works; responsive at 3 breakpoints. |
| 1.8 | `/dev` component gallery route                            | Renders typography, color, buttons, inputs, badges against tokens.        |

## Phase 2 — Authentication & workspaces ✅

**Goal:** A user can sign up, sign in, create a workspace, and land in the (empty) app.
Identity is hosted by **Clerk** (ADR-0008, supersedes ADR-0001); we store no credentials.

| #   | Task                                                       | Done when                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| 2.1 | Prisma models: `User` (clerkId mirror), `Workspace`, `WorkspaceMember` | Migration applies; relations + indexes present. No `Account`/`Session` tables. |
| 2.2 | Clerk integration: `<ClerkProvider>`, `proxy.ts` (or `middleware.ts`) | Env keys set; Clerk hosted UI reachable at `/sign-in`,`/sign-up`.   |
| 2.3 | `/api/webhooks/clerk` → `User` mirror sync                 | Svix signature verified; `user.created/updated/deleted` handled; idempotent. |
| 2.4 | `getCurrentUser()` resolver (`src/lib/api/auth.ts`)        | `await auth()` → Clerk id → local `User` mirror → `actor` or null. |
| 2.5 | Clerk auth pages wired into shell aesthetic                 | `<SignIn/>`/`<SignUp/>` restyled to match DESIGN-SYSTEM.md.        |
| 2.6 | Route protection on `/[workspaceSlug]/**`                  | Clerk middleware redirects unauthenticated to `/sign-in`.          |
| 2.7 | Onboarding flow: create workspace + first project          | Slug validated; owner `WorkspaceMember` created; redirect to board.|
| 2.8 | GitHub social sign-in via Clerk                             | Enabled as a Clerk connection; no OAuth code on our side.          |

## Phase 3 — Projects & issues ✅

**Goal:** A user can create projects and issues. Issues have stable keys (`JREL-1`) and
the data model behind the board exists.

| #   | Task                                                       | Done when                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| 3.1 | Models: `Project`, `ProjectMember`, `IssueStatus`, `IssueLabel` (+ assignments) | Migration applies; default statuses seeded on project create. |
| 3.2 | Model: `Issue` with per-project `number` allocation        | Transactional `MAX(number)+1` with retry on conflict; never reused.|
| 3.3 | Project CRUD domain + routes                               | Create/list/get/update/soft-delete; key + slug unique per workspace.|
| 3.4 | Issue CRUD domain + routes                                 | Create/list/get/patch/soft-delete; zod validation shared w/ client.|
| 3.5 | `permissions.ts` — workspace + project roles              | `canX(actor, resource)`; every route re-derives actor; 403 path.   |
| 3.6 | Project settings page (key, name, default status)          | Admin-only; restyled; optimistic updates.                          |
| 3.7 | Issue list view (table)                                    | Dense rows (32–36px); filter by status/assignee/priority/label; cursor pagination. |
| 3.8 | Issue detail (full route + side panel presentation)        | Same component, two modes; markdown description; editable fields.  |

## Phase 4 — Kanban ✅

**Goal:** The board is the working surface: drag-and-drop, keyboard, optimistic, live.

| #   | Task                                                       | Done when                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| 4.1 | Board layout: columns from `IssueStatus`, cards from `Issue` | Default project view; responsive collapse on tablet/mobile.       |
| 4.2 | Issue card component                                       | Compact; key in mono; priority/label/assignee glyphs; hover state. |
| 4.3 | Drag-and-drop move (mouse)                                | `sortOrder` midpoint recompute; optimistic; revert-on-error toast. |
| 4.4 | Keyboard move (`J/K`, `L/R`, `Enter`)                     | Full keyboard parity with mouse; visible focus ring; a11y.         |
| 4.5 | Quick-add issue (`C`) from board                           | Title-focused; defaults to project default status; creates card.   |
| 4.6 | Skeleton + empty + error states for board                  | Matches `UX.md`; never a blank screen.                             |

## Phase 5 — Sprints 🔜

**Goal:** Time-boxed iterations with planning and a velocity/throughput report.

| #   | Task                                                       | Done when                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| 5.1 | `Sprint` model + state machine (planned/active/completed)  | One active per project enforced.                                   |
| 5.2 | Sprint CRUD routes + planning view                         | Add/remove issues; drag between backlog and sprint.                |
| 5.3 | Sprint board filter ("this sprint")                        | Board scopes to active sprint when toggled.                        |
| 5.4 | Sprint report (velocity, carry-over, throughput)           | Derived from `Activity`; no new truth in dashboards.               |

## Phase 6 — Real-time collaboration 🔜

**Goal:** Multiple viewers see changes instantly; presence is shown.

| #   | Task                                                       | Done when                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| 6.1 | Socket.IO server (dev: separate process; prod: same)       | Mounts on Node HTTP server; session auth middleware.               |
| 6.2 | Typed event contract (`src/lib/realtime/events.ts`)        | Every event from `REALTIME.md` typed end-to-end.                   |
| 6.3 | Rooms: `project:join/leave`, membership re-check           | Kicked on loss of access; presence tracked.                        |
| 6.4 | Emit on issue create/update/move/comment                   | Domain layer emits after commit; clients reconcile.                |
| 6.5 | Presence stack in board header                             | Avatars + color; `aria-live` announcement of changes.              |
| 6.6 | Reconnect-refetch reconciliation                          | On reconnect, client refetches view; `updatedAt` last-writer-wins. |

## Phase 7 — GitHub integration 🔜

**Goal:** The planning surface is wired to Git. See `GITHUB-INTEGRATION.md`.

| #   | Task                                                       | Done when                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| 7.1 | GitHub App + installation flow (workspace-level)           | `GitHubInstallation`/`GitHubRepo` models; install callback works.  |
| 7.2 | Primary repo link per project                              | Settings page; stored; used for "Start" defaults.                  |
| 7.3 | Branch association (explicit + detected)                   | Key regex; commit/PR message matching; `IssueBranch` rows.         |
| 7.4 | PR association + mirror                                    | `IssuePullRequest`; `pull_request` webhook handler.                |
| 7.5 | Inbound webhook pipeline (verify + idempotent + fan-out)   | `POST /api/webhooks/github`; `GitHubDelivery` dedup.                |
| 7.6 | CI status mirror + board glyph                             | `IssueCheck`; `check_run`/`check_suite`; compact glyph on card.    |
| 7.7 | Deploy status mirror                                       | `deployment_status`; latest per env on issue.                      |
| 7.8 | Issue-side panel: branches/PRs/CI section                  | Deep-links to GitHub; never reimplements review UI.                |

## Phase 8 — Automation 🔜

**Goal:** Configurable rules turn execution events into plan changes — visibly.

| #   | Task                                                       | Done when                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| 8.1 | Merge → Done automation (per-project config)               | Triggered by `github:merged`; writes bot-attributed `Activity`.    |
| 8.2 | PR linked → In Review automation                           | Configurable; visible in timeline.                                 |
| 8.3 | Simple rules engine ("when X then Y")                      | Few well-supported rules; not a generic DSL.                       |
| 8.4 | Notifications: assignments, mentions, state changes        | `Notification` rows + `notification:new` events + inbox UI.        |

## Phase 9 — Deployment & production hardening 🔜

**Goal:** Jrello runs in production safely and observably.

| #   | Task                                                       | Done when                                                          |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| 9.1 | Multi-stage production Dockerfile                          | Standalone Next.js output; Postgres external.                      |
| 9.2 | GitHub Actions CI (lint/typecheck/test/build)              | Runs on PR; blocks merge on failure.                               |
| 9.3 | Deploy-on-merge to `main`                                  | Single container; env via secrets.                                 |
| 9.4 | Structured JSON logging + request-id correlation           | Error boundary includes request id.                                |
| 9.5 | Rate limits + auth throttling (production)                 | Per-user limits; stricter on auth endpoints.                       |
| 9.6 | Backups + restore drill (managed Postgres)                 | Documented restore procedure; tested once.                         |
| 9.7 | Observability baseline (errors, p95 latency)               | Minimal; no full APM in scope.                                     |

---

## Sequencing notes

- **Phases 1–4 are the MVP.** They must be excellent on their own — a developer should
  want to use Jrello as a planner before any GitHub wiring exists.
- **Phase 6 (real-time) is technically independent of Phase 5 (sprints)** and could be
  pulled forward if collaboration is more valuable than sprint reports. The order above
  reflects dependency, not strict chronology.
- **Phase 7 is the differentiator** but depends on the planning core being stable. Do not
  start it until Phases 1–4 are solid.
- Each task should land in its own commit/PR. No mega-PRs.
