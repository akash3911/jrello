# Jrello — Database

The canonical schema is `prisma/schema.prisma`. This document is its human-readable
companion: it explains the model, relationships, indexes, constraints, and the rules
that govern ownership and deletion. **If the two ever disagree, the Prisma schema is
correct and this doc must be updated.**

Target: PostgreSQL 15+. ORM: Prisma.

---

## Conventions (apply to every model)

- **Primary key:** `id String @id @default(uuid()) @db.Uuid` (see ADR-0004). Exposed
  to clients without concern.
- **Timestamps:** `createdAt DateTime @default(now())` and
  `updatedAt DateTime @updatedAt` on every table.
- **Soft delete:** user-authored content (issues, comments, projects, attachments) has
  `deletedAt DateTime?`. Queries exclude `deletedAt != null` via a reusable helper.
  Hard delete is only for privacy purges orphans.
- **Slugs/keys:** human-readable identifiers are `@unique` and validated by regex.
- **Money/sensitive data:** none in MVP.
- **Foreign keys:** `onDelete` is `Restrict` for membership/content references to
  prevent accidental cascade loss; soft-delete handles the "gone but referenced" case.

## Enums

```prisma
enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
}

enum ProjectRole {
  ADMIN
  MEMBER
  VIEWER
}

enum IssuePriority {
  NONE        // default; "no priority"
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum IssueStatusKind {
  BACKLOG
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELED
}

enum SprintState {
  PLANNED
  ACTIVE
  COMPLETED
}

enum ActivityType {
  ISSUE_CREATED
  ISSUE_UPDATED
  ISSUE_MOVED
  ISSUE_ASSIGNED
  ISSUE_PRIORITY_CHANGED
  ISSUE_COMMENTED
  ISSUE_LINKED
  SPRINT_ISSUE_ADDED
  SPRINT_ISSUE_REMOVED
  // github-derived (Phase 7+)
  BRANCH_CREATED
  PR_OPENED
  PR_MERGED
  CI_STATUS
}

enum NotificationType {
  ASSIGNED
  MENTIONED
  COMMENTED
  STATE_CHANGED
  // ...
}

enum AuthProvider {
  EMAIL
  GITHUB
}
```

## Models

> **Auth note (ADR-0008, supersedes ADR-0001).** Identity is managed by **Clerk**; we
> store **no credentials** and run **no `Session` table** of our own. The `User` table
> below is a **local mirror**, keyed by Clerk's user id (`clerkId`), synced from Clerk via
> the `/api/webhooks/clerk` webhook (`user.created` / `user.updated` / `user.deleted`).
> Fields marked 🔻 are **dropped** under Clerk and will not appear in `schema.prisma`:
> `passwordHash`, the `Account` model, and the `Session` model. `githubId`/`githubLogin`
> are retained only as cached display metadata when the user signs in via GitHub through
> Clerk — not for auth.

### User

A person. Identity is managed by **Clerk**; this row is a local mirror keyed by `clerkId`,
synced from Clerk's webhook, and used for foreign keys, membership, and denormalized
rendering. It stores **no credentials**.

```prisma
model User {
  id              String   @id @default(uuid()) @db.Uuid
  clerkId         String   @unique            // Clerk user id; canonical identity ref
  email           String   @unique
  emailVerifiedAt DateTime?                   // mirrored from Clerk
  name            String?
  avatarUrl       String?
  // 🔻 DROPPED under Clerk (ADR-0008): passwordHash — Clerk owns credentials
  // github (cached display metadata only; identity is via Clerk's GitHub connection)
  githubId        String?  @unique
  githubLogin     String?
  // lifecycle
  deletedAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // 🔻 DROPPED under Clerk: accounts Account[], sessions Session[]
  workspaceMembers WorkspaceMember[]
  projectMembers  ProjectMember[]
  issuesAssigned  Issue[]   @relation("IssueAssignee")
  issuesCreated   Issue[]   @relation("IssueCreator")
  comments        Comment[]
  activity        Activity[]
  notifications   Notification[]

  @@index([email])
}
```

- **Indexes:** email is unique; consider `githubId` unique for fast oauth lookup.
- **Constraints:** at least one of `passwordHash` or an OAuth `Account` must exist
  (enforced in app logic; partial unique constraints at DB level where supported).

### Account (OAuth linkage) — 🔻 DROPPED under Clerk (ADR-0008)

> Kept for historical reference. With Clerk, OAuth account linkage is Clerk's concern; we
> do not store provider accounts or tokens.

```prisma
model Account {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @db.Uuid
  provider          AuthProvider
  providerAccountId String                 // github user id
  accessToken      String?                 // encrypted at rest (Phase 7)
  refreshToken     String?
  expiresAt        Int?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}
```

### Session — 🔻 DROPPED under Clerk (ADR-0008)

> Kept for historical reference. With Clerk, session management is hosted by Clerk; the
> client holds a Clerk session JWT, and our socket middleware verifies it against Clerk's
> JWKS. We do not maintain a `Session` table.

```prisma
model Session {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @db.Uuid
  token        String   @unique            // the cookie value; hashed at rest
  userAgent    String?
  ip           String?
  expiresAt    DateTime
  revokedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

### Workspace

Topmost tenancy boundary.

```prisma
model Workspace {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  slug        String   @unique            // url segment, regex: ^[a-z0-9-]{3,40}$
  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     WorkspaceMember[]
  projects    Project[]
  notifications Notification[]

  @@index([slug])
}
```

### WorkspaceMember

Membership + role of a user in a workspace.

```prisma
model WorkspaceMember {
  id           String        @id @default(uuid()) @db.Uuid
  workspaceId  String        @db.Uuid
  userId       String        @db.Uuid
  role         WorkspaceRole @default(MEMBER)
  joinedAt     DateTime      @default(now())
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@index([userId])
}
```

- **Ownership:** a workspace always has exactly one `OWNER` (enforced in app logic;
  transferring ownership is an explicit action).
- Removing the last owner is forbidden.

### Project

A unit of work inside a workspace; carries its own issue-key prefix.

```prisma
model Project {
  id           String   @id @default(uuid()) @db.Uuid
  workspaceId  String   @db.Uuid
  name         String
  slug         String                          // unique within workspace
  key          String                          // issue prefix, e.g. JREL; regex ^[A-Z]{2,6}$
  description  String?
  icon         String?
  deletedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Restrict)
  members      ProjectMember[]
  issues       Issue[]
  statuses     IssueStatus[]
  labels       IssueLabel[]
  sprints      Sprint[]

  @@unique([workspaceId, slug])
  @@unique([workspaceId, key])
  @@index([workspaceId])
}
```

- `key` is unique per workspace so issue identifiers are unambiguous.
- `key` is mutable but discouraged; renaming re-keys display but not stored ids.

### ProjectMember

Per-project membership, overriding/attaching to workspace membership.

```prisma
model ProjectMember {
  id          String       @id @default(uuid()) @db.Uuid
  projectId   String       @db.Uuid
  userId      String       @db.Uuid
  role        ProjectRole  @default(MEMBER)
  joinedAt    DateTime     @default(now())
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([userId])
}
```

- A workspace member is implicitly a `VIEWER` of all projects unless explicitly added
  with a higher role (app-layer rule).
- Project admins are a subset of workspace members.

### Issue

The atomic work item. Stable display key is `project.key + '-' + number`.

```prisma
model Issue {
  id            String         @id @default(uuid()) @db.Uuid
  projectId     String         @db.Uuid
  number        Int                              // per-project, monotonically increasing
  title         String
  description   String?                          // markdown
  statusId      String         @db.Uuid
  priority      IssuePriority  @default(NONE)
  sortOrder     Float                            // kanban ordering within status column
  estimate      Int?                             // story points, optional
  dueDate       DateTime?
  sprintId      String?        @db.Uuid
  assigneeId    String?        @db.Uuid
  createdById   String         @db.Uuid
  deletedAt     DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  project       Project        @relation(fields: [projectId], references: [id], onDelete: Restrict)
  status        IssueStatus    @relation(fields: [statusId], references: [id], onDelete: Restrict)
  sprint        Sprint?        @relation(fields: [sprintId], references: [id], onDelete: SetNull)
  assignee      User?          @relation("IssueAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  createdBy     User           @relation("IssueCreator", fields: [createdById], references: [id], onDelete: Restrict)
  comments      Comment[]
  labels        IssueLabelAssignment[]
  activity      Activity[]
  // github links (Phase 7+): branches[], pullRequests[]

  @@unique([projectId, number])
  @@index([projectId, statusId])
  @@index([projectId, sprintId])
  @@index([assigneeId])
  @@index([sortOrder])
}
```

- **`number`** is assigned per-project by a transactional `MAX(number)+1` (with a retry
  on conflict). Never reused, even after delete.
- **`sortOrder Float`:** supports drag-drop ordering without rewriting every row;
  midpoint insertion. Re-balanced periodically (app-layer) to avoid float precision
  decay.

### IssueStatus

The columns of the board. Per-project, ordered.

```prisma
model IssueStatus {
  id          String           @id @default(uuid()) @db.Uuid
  projectId   String           @db.Uuid
  name        String                              // "Backlog", "In Progress"
  kind        IssueStatusKind
  color       String           @default("gray")   // palette key, not arbitrary hex
  sortOrder   Int
  isDefault   Boolean          @default(false)     // new issues land here
  deletedAt   DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issues  Issue[]

  @@unique([projectId, name])
  @@index([projectId, sortOrder])
}
```

- A project is created with a sensible default set: Backlog, Todo, In Progress, In
  Review, Done. These are editable.
- Exactly one `isDefault = true` per project (enforced in app logic).

### IssueLabel & IssueLabelAssignment

Labels are scoped per-project; color from the fixed palette.

```prisma
model IssueLabel {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String   @db.Uuid
  name        String
  color       String                          // palette key
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issues  IssueLabelAssignment[]

  @@unique([projectId, name])
}

model IssueLabelAssignment {
  issueId String @db.Uuid
  labelId String @db.Uuid

  issue Issue       @relation(fields: [issueId], references: [id], onDelete: Cascade)
  label IssueLabel  @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([issueId, labelId])
  @@index([labelId])
}
```

### Sprint

A time-boxed iteration within a project (Phase 5).

```prisma
model Sprint {
  id          String       @id @default(uuid()) @db.Uuid
  projectId   String       @db.Uuid
  name        String                              // "Sprint 12"
  goal        String?
  state       SprintState  @default(PLANNED)
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issues  Issue[]

  @@index([projectId, state])
  @@index([projectId, startDate])
}
```

- Only one `ACTIVE` sprint per project at a time (app-enforced).

### Comment

Threaded? MVP: **flat** comments on an issue. Threading is post-MVP.

```prisma
model Comment {
  id         String   @id @default(uuid()) @db.Uuid
  issueId    String   @db.Uuid
  userId     String   @db.Uuid
  body       String                          // markdown
  deletedAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([issueId, createdAt])
}
```

### Activity

An append-only event log per issue (and project-wide via the issue relation).

```prisma
model Activity {
  id          String       @id @default(uuid()) @db.Uuid
  issueId     String       @db.Uuid
  actorId     String?      @db.Uuid           // null for system/github
  type        ActivityType
  payload     Json                              // structured, typed in app code
  createdAt   DateTime     @default(now())

  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  actor User? @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([issueId, createdAt])
}
```

- `payload Json` is the one sanctioned use of JSON — typed in TS via a discriminated
  union on `type`. Never queried into deeply.

### Notification

Per-user inbox. Created by domain events (assignment, mention, state change).

```prisma
model Notification {
  id           String           @id @default(uuid()) @db.Uuid
  userId       String           @db.Uuid
  workspaceId  String           @db.Uuid
  type         NotificationType
  issueId      String?          @db.Uuid
  actorId      String?          @db.Uuid
  readAt       DateTime?
  createdAt    DateTime         @default(now())

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  actor     User?      @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([userId, readAt])
  @@index([userId, createdAt])
}
```

## Relationships summary

```
Workspace 1───* WorkspaceMember *───1 User
Workspace 1───* Project 1───* ProjectMember *───1 User
Project   1───* Issue *───1 IssueStatus
Project   1───* IssueStatus
Project   1───* IssueLabel *───* Issue  (via IssueLabelAssignment)
Project   1───* Sprint 1───* Issue
Issue     1───* Comment
Issue     1───* Activity
User      1───* Notification
```

## Ownership rules

- A **workspace owner** can delete the workspace (soft), manage members, transfer
  ownership.
- A **workspace admin** can manage workspace members and projects.
- A **project admin** can edit project settings, statuses, labels, and members.
- A **project member** can create/edit/move issues they can see.
- A **project viewer** can read only.
- Issues are owned by the project, not by the assignee. Any project member can edit an
  issue. Assignee is "current responsibility," not ownership.

## Indexes strategy

- Every foreign key has an index (Prisma auto-indexes `@id`/`@unique` but we add
  explicit indexes on FKs used in filters/joins).
- Composite indexes cover the hot read paths: `(projectId, statusId)` for board loads,
  `(issueId, createdAt)` for activity, `(userId, readAt)` for notification inbox.

## Soft-delete strategy

- `deletedAt` on: `User`, `Workspace`, `Project`, `Issue`, `Comment`, `IssueStatus`.
- A reusable Prisma extension (or query helper) auto-applies `deletedAt: null` to reads
  and sets `deletedAt` on `delete`.
- **Foreign keys are not cascade-deleted on soft delete** — references stay valid; the
  soft-deleted entity simply stops appearing.
- Hard delete (true purge) is a separate, audited operation for GDPR/privacy.
