# Jrello — GitHub Integration (Phase 7+)

> This is a **design specification for future work**, not an implemented feature. It is
> written now so the data model, API, and real-time contracts leave room for it without a
> rewrite. Anything marked *Phase 7+* in other docs is defined here.

Jrello's differentiator is that the **planning surface is wired into the development
lifecycle by default**. This document describes how GitHub becomes that execution layer:
how repositories connect, how branches and PRs associate with issues, how CI and deploy
status flow back, and how issue state is automated from Git events.

It is deliberately constrained to GitHub. We are not building a generic "DevOps connector."
GitLab/Bitbucket are explicit non-goals for the foreseeable future.

---

## Guiding principles

1. **GitHub is a source, not a sink of truth for plan state.** Our DB is the system of
   record for *planning*; GitHub is the system of record for *execution*. We mirror the
   minimum execution state needed to render the board and never pretend to own it.
2. **Never block a render on a live GitHub call.** All GitHub-sourced UI state (CI, PR
   state) is cached in our DB with a short TTL and refreshed by webhook. A stale value is
   always preferable to a hanging page.
3. **Webhooks drive state; the REST API fills gaps.** Webhooks are the low-latency,
   push-based source. REST/GraphQL is used on-demand (open issue → fetch current PR list)
   and for backfill.
4. **Fast webhook responses.** GitHub expects 2xx within ~10s. Handlers verify, persist,
   emit, and return — heavy work is deferred. We never do synchronous GitHub calls inside
   a webhook handler.
5. **Idempotency everywhere.** GitHub redelivers and retries. Handlers are idempotent by
   delivery id and by content hash.
6. **Least privilege.** We request the minimum scopes that deliver the workflow. A GitHub
   App with per-repo installation is preferred over a user OAuth token with broad scope.

## Connection model

### GitHub App vs OAuth App

**Decision: GitHub App (preferred), OAuth App as a fallback only.**

- A **GitHub App** installs per-repo (or per-org), delivers webhooks without polling,
  scopes permissions finely (contents, pull-requests, checks, deployments, metadata), and
  acts as a first-class bot identity. It is the right shape for a product that lives
  across many repos.
- An **OAuth App** is used **only** for sign-in (identity) in Phase 2 — see `API.md` and
  `DECISIONS.md` (ADR-0001). Repo access in Phase 7 is via the GitHub App installation,
  not the user's personal OAuth token.

### Workspace → installation mapping

- A GitHub App **installation** is scoped to a **workspace** (one installation per
  workspace). All repos made available by that installation can be linked to projects in
  the workspace.
- Connecting is a workspace-ADMIN action: it kicks off the GitHub App install flow
  (`GET /installations/new`), GitHub redirects back with an `installation_id`, and we
  store `GitHubInstallation { workspaceId, installationId, accountLogin, ... }`.
- Disconnecting revokes our knowledge of the installation (and we stop receiving
  webhooks); it does **not** delete issue history we already recorded.

### Token strategy

- We obtain **installation access tokens** (short-lived, ~1h) from the GitHub App by
  signing a JWT with our private key. These are cached in-memory with refresh before
  expiry. We do **not** store long-lived user tokens.
- User-level OAuth tokens (from sign-in) are used only for identity, not for repo reads.

## Data model (additions — Phase 7)

These tables are referenced by `Issue` and are not part of the MVP migration. Listed here
so the schema design doesn't preclude them. (Authoritative once implemented: `prisma/schema.prisma`.)

```prisma
model GitHubInstallation {
  id             String   @id @default(uuid()) @db.Uuid
  workspaceId    String   @db.Uuid
  installationId Int                       // GitHub numeric id
  accountLogin   String                    // org/user the app is installed on
  accountType    String                    // "Organization" | "User"
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  repos     GitHubRepo[]

  @@unique([workspaceId, installationId])
  @@index([installationId])
}

model GitHubRepo {
  id             String   @id @default(uuid()) @db.Uuid
  installationId String   @db.Uuid            // -> GitHubInstallation
  repoId         Int                          // GitHub node-numeric id
  fullName       String                       // "acme/web-app"
  defaultBranch  String                       // "main"
  // optional explicit link: a repo can be the "primary" repo for a project
  projectId      String?  @db.Uuid
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  installation GitHubInstallation @relation(fields: [installationId], references: [id], onDelete: Cascade)
  project      Project?            @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@unique([installationId, repoId])
  @@index([projectId])
  @@index([fullName])
}

model IssueBranch {
  id        String   @id @default(uuid()) @db.Uuid
  issueId   String   @db.Uuid
  repoId    String   @db.Uuid
  name      String                       // branch ref
  headSha   String?
  createdAt DateTime @default(now())

  issue Issue       @relation(fields: [issueId], references: [id], onDelete: Cascade)
  repo  GitHubRepo  @relation(fields: [repoId], references: [id], onDelete: Restrict)

  @@unique([repoId, name])
  @@index([issueId])
}

model IssuePullRequest {
  id             String   @id @default(uuid()) @db.Uuid
  issueId        String   @db.Uuid
  repoId         String   @db.Uuid
  number         Int                          // GitHub PR number
  title          String
  state          String                       // "open" | "closed"
  merged         Boolean     @default(false)
  mergeableState String?                      // "clean" | "blocked" | ...
  headSha        String?
  url            String
  updatedAt      DateTime                     // mirror of GitHub PR updated_at
  createdAt      DateTime @default(now())

  issue Issue       @relation(fields: [issueId], references: [id], onDelete: Cascade)
  repo  GitHubRepo  @relation(fields: [repoId], references: [id], onDelete: Restrict)
  checks IssueCheck[]

  @@unique([repoId, number])
  @@index([issueId])
}

model IssueCheck {
  id            String   @id @default(uuid()) @db.Uuid
  pullRequestId String   @db.Uuid
  name          String                       // "ci / build"
  status        String                       // "queued" | "in_progress" | "completed"
  conclusion    String?                      // "success" | "failure" | ...
  detailsUrl    String?
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  pullRequest IssuePullRequest @relation(fields: [pullRequestId], references: [id], onDelete: Cascade)

  @@index([pullRequestId])
}

// Webhook delivery dedup — idempotency
model GitHubDelivery {
  id          String   @id @default(uuid()) @db.Uuid
  deliveryId  String   @unique              // GitHub's X-GitHub-Delivery uuid
  eventType   String
  receivedAt  DateTime @default(now())
}
```

These are intentionally append-only / mirror tables. `Issue.activity` already carries a
discriminated-union `payload` for `BRANCH_CREATED`, `PR_OPENED`, `PR_MERGED`, `CI_STATUS`
(see `ActivityType` in `DATABASE.md`), so the activity feed needs no schema change.

## Repository connection

1. Workspace admin opens *Workspace → Settings → GitHub* and clicks *Install / Connect*.
2. We redirect to GitHub's App install URL with our app id and the workspace id in state.
3. GitHub returns to `/api/v1/workspaces/:slug/github/callback?installation_id=...`.
4. We persist `GitHubInstallation`, fetch the list of accessible repos via REST
   (`GET /installation/repositories`), and store them as `GitHubRepo` rows.
5. In a project's *Settings → GitHub*, an admin may set a **primary repo** for that
   project (sets `GitHubRepo.projectId`). This is what enables "Start issue → create
   branch" defaults.

A repo can be linked to at most one project as primary, but a branch/PR can still be
associated to any issue in the workspace by key detection (below).

## Branch association

Two modes, both supported:

1. **Explicit (user-initiated).** On an issue, a member clicks *Associate branch* (or
   *Start* on the issue, which suggests creating one). We offer a default name
   `${KEY}-${number}/${slug-of-title}` (e.g., `JREL-142/add-login-rate-limit`). Creating
   the branch is a GitHub API call (`POST /repos/:owner/:repo/git/refs`); we store an
   `IssueBranch`.
2. **Detected (commit/PR message matching).** We scan commit messages and PR
   titles/bodies for issue keys (`JREL-142`). Matches are linked automatically to an
   `IssueBranch` / `IssuePullRequest`. This is how work started outside Jrello still gets
   wired in.

**Key-detection regex:** `\b([A-Z]{2,6})-(\d{1,6})\b`, validated against the
`project.key` of repos in the same installation so cross-workspace keys never match.

## Pull request association

- On `pull_request` webhook (opened/reopened/ready_for_review), we create/update
  `IssuePullRequest` for any issue keys found in the title or body, linked to the right
  `GitHubRepo`.
- A PR may be associated with **multiple issues** (one row per issue per PR). An issue
  may have **multiple PRs** over its lifetime.
- PR state changes (`closed` + `merged`, draft toggles) mirror into `IssuePullRequest`
  and emit a `github:pr` or `github:merged` real-time event (see `REALTIME.md`).

## CI status

- On `check_run` and `check_suite` webhooks, we upsert `IssueCheck` rows on the PRs whose
  `headSha` matches. The most recent relevant conclusion per name is what we render.
- The board and issue card show a compact CI glyph (success/fail/pending/none) derived
  from the PR's checks, not a wall of individual checks.
- We **do not** poll. Status arrives via webhook. If a view is opened and the cached state
  is older than the TTL (e.g., 60s), a background refetch is triggered (not awaited by the
  render path).

## Deployment status

- `deployment_status` webhooks update a small `IssueCheck`-like summary (or a dedicated
  `IssueDeployment` mirror once warranted) and surface a *deployed → env* line on the issue.
- We render the latest deployment per environment (production, preview), not history.

## Webhook handling

Single inbound route: `POST /api/webhooks/github`.

### Pipeline (in handler)

1. **Verify signature** (`X-Hub-Signature-256` HMAC with our webhook secret) before any
   parsing. Invalid → `401`, no further work.
2. **Idempotency check** on `X-GitHub-Delivery`. If already in `GitHubDelivery`, return
   `200` and do nothing.
3. **Persist delivery** id, event type (`X-GitHub-Event`), receivedAt.
4. **Fan out** to a typed handler per event (below). Each handler is thin:
   resolve the affected issue(s) → transactionally upsert mirror rows + write `Activity` →
   emit Socket.IO events to `project:<projectId>`.
5. **Respond `200`** immediately. Any deferred follow-up work (e.g., a deeper REST
   backfill) is enqueued, not awaited.

### Handled events

| `X-GitHub-Event` | action(s)                              | Effect                                            |
| ---------------- | -------------------------------------- | ------------------------------------------------- |
| `installation`   | `created`, `deleted`                   | Add/remove `GitHubInstallation`; refresh repos.   |
| `installation_repositories` | `added`, `removed`          | Update `GitHubRepo` set for the installation.     |
| `push`           | —                                      | Detect issue keys in commit messages → `IssueBranch`, `BRANCH_CREATED` activity. |
| `pull_request`   | `opened`, `reopened`, `closed`, `edited`, `ready_for_review` | Upsert `IssuePullRequest`; on `closed`+`merged` emit `github:merged` and run **merge automation**. |
| `check_run`      | `created`, `completed`                 | Upsert `IssueCheck`; emit `github:ci`.            |
| `check_suite`    | `completed`                            | Roll-up; update per-PR CI glyph.                  |
| `deployment_status` | `created`                           | Update deployment summary on linked issue(s).     |
| `delete`         | (branch delete)                       | Mark matching `IssueBranch` as deleted (soft).    |

Webhooks we **don't** care about in MVP-7 (e.g., `issues`, `label`, `fork`) are ignored,
not errored — we still acknowledge them `200`.

## Issue-state automation (Phase 8 — preview)

Merge is the highest-value automation. Configurable per-project in *Settings*:

| Trigger                            | Default action                    | Configurable |
| ---------------------------------- | --------------------------------- | ------------ |
| PR linked to issue                 | move to *In Review*               | yes          |
| CI fails on linked PR              | set priority → *High* (optional)  | yes          |
| PR merged                          | move to *Done*                    | yes          |
| All linked PRs merged              | move to *Done* (if not already)   | yes          |
| Branch pushed without PR           | leave state; log activity only    | n/a          |

Automation is **explicit and visible**, never silent: every automated transition writes
an `Activity` row attributed to the *Jrello GitHub bot* (`actorId = null`, payload names
the trigger) so the timeline explains *why* an issue moved.

## Security considerations

- **Webhook secret** stored in env, never logged. Signature verification is the first line
  against spoofed deliveries.
- **App private key** stored as a secret (env / secret manager), used only to sign JWTs
  in-process.
- **No tokens in URLs.** OAuth/installation flows use `state` CSRF tokens validated on
  return.
- **Repo isolation:** a webhook from repo R can only affect issues in the workspace whose
  installation contains R. We never trust the payload's "project" — we derive it.
- **PII:** commit author emails are not stored; we keep names/handles only as needed for
  activity attribution.

## Failure modes & degradation

| Failure                         | Behavior                                                         |
| ------------------------------- | ---------------------------------------------------------------- |
| Webhook secret invalid          | `401`, ignored.                                                  |
| GitHub API rate-limited         | Backoff; cached mirror state stays; UI shows last-known value.   |
| Webhook delayed / out of order  | `updatedAt` on `IssuePullRequest` guards last-writer-wins.       |
| Installation revoked            | `GitHubInstallation` marked inactive; issues keep their history; future links become read-only. |
| Branch/PR orphaned (issue deleted) | Rows retained (soft-delete on issue); stop rendering.        |

## Out of scope (this phase)

- GitLab / Bitbucket / other forge support.
- Inline code review UI (we deep-link to GitHub, not reimplement review).
- Auto-creating PRs from templates beyond the simple "Start" branch flow.
- GitHub Enterprise self-hosted support (hosted github.com only in Phase 7).
