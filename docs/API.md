# Jrello — API

The API surface for Jrello's MVP. It is implemented as **Next.js Route Handlers**
(REST) and **Server Actions** (for client-initiated mutations with optimistic UX). This
document describes the REST surface conceptually; request/response concepts, not
exhaustive field lists, which live in zod schemas and TS types in the codebase.

Conventions:

- Base path: `/api/v1`. Versioned from day one to avoid a painful rename later.
- Auth: **Clerk** hosts sign-up / sign-in / sessions (ADR-0008). Route Handlers and
  Server Actions resolve the actor via `await auth()` (Clerk) → local `User` mirror. No
  credentials are stored on our side.
- Content type: `application/json` unless otherwise noted.
- Errors: RFC-style problem shape:
  ```json
  { "error": { "code": "forbidden", "message": "Not a project member." } }
  ```
- Authorization: every endpoint re-derives the actor from the session and checks
  `permissions.canX`. UI hiding is not authorization.

Status code discipline:

- `200` success with body; `201` created; `204` success no body.
- `400` validation; `401` unauthenticated; `403` forbidden; `404` not found (or hidden);
  `409` conflict (e.g., duplicate slug); `429` rate limited.

---

## Authentication

Identity is hosted by **Clerk** (ADR-0008, supersedes ADR-0001). Clerk renders the sign-in
and sign-up UI at `/sign-in` and `/sign-up` (and the account/hosted UI), issues session
JWTs, and handles email + GitHub social + passkeys. Our API never sees passwords.

| Method | Route                          | Purpose                                                    |
| ------ | ------------------------------ | ---------------------------------------------------------- |
| GET    | `/sign-in`, `/sign-up`         | Clerk-hosted auth UI (rendered by `<SignIn/>`/`<SignUp/>`).|
| GET    | `/api/v1/auth/me`              | Current local `User` mirror + workspaces + roles.          |
| POST   | `/api/webhooks/clerk`          | Clerk webhook → create/update/delete `User` mirror.        |

Concepts:

- `/api/v1/auth/me` reads `await auth()` → Clerk user id → resolves the local `User`
  mirror, then returns enough for the shell to bootstrap: user, workspaces, last-used
  workspace, per-workspace/project roles.
- `/api/webhooks/clerk` verifies the Clerk webhook signature (Svix), then handles
  `user.created` (create mirror), `user.updated` (sync name/email/avatar), and
  `user.deleted` (soft-delete mirror). This is the only write path for the `User` table.
- Rate limiting on auth endpoints is handled by Clerk. Our login-brute-force concerns from
  ADR-0001 no longer apply.

## Workspaces

| Method | Route                                | Auth                       | Purpose             |
| ------ | ------------------------------------ | -------------------------- | ------------------- |
| POST   | `/api/v1/workspaces`                 | any authed user            | Create workspace.   |
| GET    | `/api/v1/workspaces/:slug`           | member                     | Get workspace.      |
| PATCH  | `/api/v1/workspaces/:slug`           | workspace ADMIN/OWNER      | Rename, update.     |
| DELETE | `/api/v1/workspaces/:slug`           | OWNER only                 | Soft-delete.        |
| GET    | `/api/v1/workspaces/:slug/members`   | member                     | List members.       |
| POST   | `/api/v1/workspaces/:slug/members`   | ADMIN/OWNER                | Invite/add member.  |
| PATCH  | `/api/v1/workspaces/:slug/members/:userId` | ADMIN/OWNER (or self) | Change role / leave.|
| DELETE | `/api/v1/workspaces/:slug/members/:userId` | ADMIN/OWNER          | Remove member.      |

Validation expectations:

- `slug`: `^[a-z0-9-]{3,40}$`, unique.
- `name`: 1–80 chars.
- Invite accepts either `email` (sends invite) or `userId` (existing workspace-eligible
  user). Role defaults to `MEMBER`.

## Projects

| Method | Route                                                 | Auth               | Purpose           |
| ------ | ----------------------------------------------------- | ------------------ | ----------------- |
| GET    | `/api/v1/workspaces/:slug/projects`                   | workspace member   | List projects.    |
| POST   | `/api/v1/workspaces/:slug/projects`                   | workspace member   | Create project.   |
| GET    | `/api/v1/workspaces/:slug/projects/:projectSlug`      | project viewer+    | Get project.      |
| PATCH  | `/api/v1/workspaces/:slug/projects/:projectSlug`      | project ADMIN      | Update.           |
| DELETE | `/api/v1/workspaces/:slug/projects/:projectSlug`      | project ADMIN      | Soft-delete.      |
| GET    | `.../projects/:projectSlug/members`                   | project viewer+    | List members.     |
| POST   | `.../projects/:projectSlug/members`                   | project ADMIN      | Add member.       |
| PATCH  | `.../projects/:projectSlug/members/:userId`           | project ADMIN      | Change role.      |
| DELETE | `.../projects/:projectSlug/members/:userId`           | project ADMIN      | Remove.           |

Concepts:

- Creating a project seeds default `IssueStatus` rows and assigns a `key` (validated
  unique per workspace, `^[A-Z]{2,6}$`).
- Project membership is **additive** to workspace membership; workspace members are
  implicit viewers unless added with a role.

## Issues

| Method | Route                                                       | Auth             | Purpose                 |
| ------ | ----------------------------------------------------------- | ---------------- | ----------------------- |
| GET    | `/api/v1/projects/:projectId/issues`                        | project viewer+  | List/filter issues.     |
| POST   | `/api/v1/projects/:projectId/issues`                        | project member+  | Create issue.           |
| GET    | `/api/v1/projects/:projectId/issues/:number`                | project viewer+  | Get one by number.      |
| PATCH  | `/api/v1/projects/:projectId/issues/:number`                | project member+  | Update fields.          |
| DELETE | `/api/v1/projects/:projectId/issues/:number`                | project member+  | Soft-delete.            |
| POST   | `/api/v1/projects/:projectId/issues/:number/move`           | project member+  | Change status + order.  |

Concepts:

- List supports filters: `status`, `assignee`, `label`, `priority`, `sprint`, `q`
  (title search). Pagination via cursor for list view; the board fetches by status
  column without pagination.
- `POST /issues` accepts `title`, `description`, `statusId?` (defaults to project
  default), `assigneeId?`, `priority?`, `labelIds?`. Server assigns `number`.
- `PATCH` accepts partial fields; each meaningful change writes an `Activity` row.
- `move` accepts `{ statusId, beforeId?, afterId? }` and recomputes `sortOrder` via
  midpoint. Authorization: member+.

### Issue statuses (board columns)

| Method | Route                                                | Auth          | Purpose        |
| ------ | ---------------------------------------------------- | ------------- | -------------- |
| GET    | `/api/v1/projects/:projectId/statuses`               | viewer+       | List columns.  |
| POST   | `/api/v1/projects/:projectId/statuses`               | project ADMIN | Create column. |
| PATCH  | `/api/v1/projects/:projectId/statuses/:statusId`     | project ADMIN | Update column. |
| DELETE | `/api/v1/projects/:projectId/statuses/:statusId`     | project ADMIN | Remove column. |
| POST   | `/api/v1/projects/:projectId/statuses/reorder`       | project ADMIN | Reorder.       |

- Deleting a column requires its issues to be moved elsewhere first (409 otherwise).

### Labels

| Method | Route                                            | Auth          | Purpose       |
| ------ | ------------------------------------------------ | ------------- | ------------- |
| GET    | `/api/v1/projects/:projectId/labels`             | viewer+       | List labels.  |
| POST   | `/api/v1/projects/:projectId/labels`             | project ADMIN | Create label. |
| PATCH  | `/api/v1/projects/:projectId/labels/:labelId`     | project ADMIN | Update.       |
| DELETE | `/api/v1/projects/:projectId/labels/:labelId`     | project ADMIN | Delete.       |

## Comments

| Method | Route                                                        | Auth            | Purpose         |
| ------ | ------------------------------------------------------------ | --------------- | --------------- |
| GET    | `/api/v1/issues/:issueId/comments`                           | project viewer+ | List comments.  |
| POST   | `/api/v1/issues/:issueId/comments`                           | project member+ | Add comment.    |
| PATCH  | `/api/v1/issues/:issueId/comments/:commentId`                | author/admin    | Edit.           |
| DELETE | `/api/v1/issues/:issueId/comments/:commentId`                | author/admin    | Soft-delete.    |

- Editing is restricted to the author or a project admin.
- Comments render markdown; mentions (`@name`) create notifications.

## Sprints (Phase 5 — defined for completeness)

| Method | Route                                            | Auth          | Purpose           |
| ------ | ------------------------------------------------ | ------------- | ----------------- |
| GET    | `/api/v1/projects/:projectId/sprints`            | viewer+       | List sprints.     |
| POST   | `/api/v1/projects/:projectId/sprints`            | project ADMIN | Create.           |
| PATCH  | `/api/v1/projects/:projectId/sprints/:sprintId`  | project ADMIN | Update/state.     |
| POST   | `/api/v1/projects/:projectId/sprints/:sprintId/issues` | member+   | Add issue to sprint. |
| DELETE | `/api/v1/projects/:projectId/sprints/:sprintId/issues/:issueId` | member+ | Remove from sprint. |

## Activity

| Method | Route                                            | Auth        | Purpose               |
| ------ | ------------------------------------------------ | ----------- | --------------------- |
| GET    | `/api/v1/issues/:issueId/activity`               | viewer+     | Issue activity feed.  |
| GET    | `/api/v1/projects/:projectId/activity`           | viewer+     | Project activity feed.|

- Append-only; no edits/deletes.
- Cursor-paginated by `createdAt`.

## Notifications

| Method | Route                                            | Auth | Purpose                  |
| ------ | ------------------------------------------------ | ---- | ------------------------ |
| GET    | `/api/v1/notifications`                          | auth | Inbox (unread first).    |
| POST   | `/api/v1/notifications/:id/read`                 | auth | Mark read.               |
| POST   | `/api/v1/notifications/read-all`                 | auth | Mark all read.           |

- Scoped to the current user only.

## GitHub integration (Phase 7+ — conceptual)

| Method | Route                                                  | Auth                  | Purpose                |
| ------ | ------------------------------------------------------ | --------------------- | ---------------------- |
| GET    | `/api/v1/auth/github/repos`                            | auth                  | List linkable repos.   |
| POST   | `/api/v1/workspaces/:slug/github/connect`              | workspace ADMIN       | Install/connect repo.  |
| DELETE | `/api/v1/workspaces/:slug/github/connect`              | workspace ADMIN       | Disconnect.            |
| POST   | `/api/v1/issues/:issueId/branches`                     | project member+       | Associate branch.      |
| POST   | `/api/v1/issues/:issueId/pulls`                        | project member+       | Associate PR.          |
| GET    | `/api/v1/issues/:issueId/github`                       | viewer+               | Branches + PRs + CI.   |
| POST   | `/api/webhooks/github`                                 | signed (GH secret)    | Inbound webhook.       |

Concepts and full webhook contract in `GITHUB-INTEGRATION.md`.

## Validation expectations (cross-cutting)

- All input validated by zod schemas co-located with the domain module; shared with the
  client for form validation.
- IDs in paths are UUIDs; slugs match their regex; enums reject unknown values.
- Pagination: `?cursor=...&limit=20` (limit clamped to 100). Responses include
  `nextCursor` or `null`.

## Rate limiting

- Auth rate limiting (sign-in / sign-up brute force) is handled by **Clerk** (ADR-0008).
- Other endpoints: generous per-user limits in production (Phase 9).
