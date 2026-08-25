# Jrello

Dense, fast, **keyboard-first** issue tracking and project planning for engineering teams.

Kanban boards with optimistic drag-and-drop, sprint planning with velocity reports,
realtime presence over Socket.IO, GitHub-aware issue keys, and a ⌘K command palette —
built with Next.js 16 (App Router), Prisma 7 + PostgreSQL, Tailwind CSS 4, and Clerk
(optional, see below).

---

## Quick start (zero config)

```bash
pnpm install
docker compose up -d db      # Postgres 15 on localhost:5432
cp .env.example .env         # defaults work out of the box
pnpm db:push                 # create schema
pnpm db:seed                 # optional: demo workspace + 8 issues
pnpm dev                     # custom server with realtime on :3000
```

Open http://localhost:3000.

> **No Clerk keys? No problem.** Without keys the app runs in **local auth mode**:
> requests are auto-authenticated as a seeded local developer, so every feature is
> usable immediately. Add Clerk keys later and full multi-user auth activates.

## Environment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Defaults to the docker-compose Postgres |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | no | Enables Clerk mode when present |
| `CLERK_SECRET_KEY` | no | Enables Clerk mode when present |
| `CLERK_WEBHOOK_SECRET` | no | Svix signature verification for `/api/webhooks/clerk` |
| `GITHUB_WEBHOOK_SECRET` | no | HMAC check for `/api/webhooks/github` |

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Custom Next server (`src/server.ts`) + Socket.IO + tsx watch |
| `pnpm build` / `pnpm start` | Production build / serve via the custom server |
| `pnpm typecheck` · `pnpm lint` | TypeScript strict pass / ESLint |
| `pnpm db:push` · `db:seed` · `db:studio` | Schema sync, demo data, data browser |

## Feature map

- **Board** — HTML5 drag-and-drop between columns, midpoint sort orders, quick-add
  composer per column, keyboard navigation (`J K H L`, `Enter`, `C`), live presence.
- **Issues** — dense filterable list, slide-over detail panel with inline editing,
  comments, soft delete.
- **Sprints** — plan/start/complete lifecycle (one active per project), backlog
  allocation, carry-over of unfinished work.
- **Reports** — committed vs delivered velocity chart derived only from real
  completed sprints.
- **Realtime** — Socket.IO room per project; creates/moves/deletes broadcast to all
  viewers; presence avatars update on join/leave/disconnect.
- **Command palette** — `⌘K`: project jumps, issue search across projects,
  direct `KEY-123` lookup, theme toggle.

## API surface (`/api/v1`)

```
GET/POST   /workspaces
GET/PATCH/DELETE /workspaces/:ws/projects/:project        # slug or key accepted
GET/POST   /workspaces/:ws/projects/:p/issues
GET/PATCH/DELETE /workspaces/:ws/projects/:p/issues/:n    # :n = issue number
POST       /workspaces/:ws/projects/:p/issues/:n/move     # fractional sort order
POST       /workspaces/:ws/projects/:p/issues/:n/comments
GET/POST   /workspaces/:ws/projects/:p/sprints
POST       /workspaces/:ws/projects/:p/sprints/:id/start
POST       /workspaces/:ws/projects/:p/sprints/:id/complete
POST       /workspaces/:ws/projects/:p/sprints/assign     # {issueId, sprintId}
GET/PATCH  /workspaces/:ws/notifications                  # list / mark-all-read
PATCH      /workspaces/:ws/notifications/:id/read
GET        /api/health                                    # liveness + db latency
```

All mutations write activity-log entries; assignment changes create notifications;
relevant mutations broadcast Socket.IO events to the project room.

## Architecture notes

- `src/server.ts` — custom HTTP server wrapping Next; owns Socket.IO and publishes
  it to route handlers via `lib/realtime/server.ts`.
- `src/lib/api/*` — domain layer (auth, workspaces, projects, issues, sprints,
  notifications). Route handlers stay thin and share `apiDataError` mapping.
- Server Components fetch through the domain layer directly; client mutations go
  through REST endpoints above.
- Auth is centralized in `lib/auth-mode.ts` + `lib/api/auth.ts`; Clerk and local
  modes expose the identical `getCurrentUser()` contract.
