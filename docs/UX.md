# Jrello — UX

This document defines the user experience of Jrello: how it is structured, how people
move through it, and the interaction principles that make it feel like a developer tool
rather than a generic PM application.

It is a **constraint document**. UI work that contradicts the principles here is wrong
by default and must be justified explicitly.

---

## Interaction principles

1. **Keyboard-first, mouse-complete.** Every primary action has a keyboard path. The
   mouse is never the only way to do something important, but it is always a pleasant
   way. Never optimize one at the cost of the other.
2. **Density over whitespace.** Information is the product. A developer's screen should
   show their work, not empty chrome. Whitespace is used to separate, not to fill.
3. **Speed is a feature.** Interactions should feel immediate. Optimistic UI for
   high-confidence actions; never block on a network round-trip for a local change.
4. **One focal surface at a time.** A view (board, list, issue detail) is the focus.
   Modals and panels augment, they don't compete.
5. **Status is always visible.** Whatever you're looking at, the relevant system state
   (loading, saving, error, offline, real-time) is implied or shown without hunting.
6. **Reversible by default.** Destructive actions ask. Edits can be undone or are
   optimistic enough that they feel instant.
7. **No mystery meat.** Every clickable thing looks clickable or behaves predictably
   under hover/focus. No decorative elements that pretend to be interactive.

## Keyboard-first considerations

A **command palette** (`Cmd/Ctrl+K`) is the center of the keyboard experience. From it:

- Create issue, switch project, switch workspace, jump to issue by ID (`JREL-142`),
  change view, invite member, open settings.

Global shortcuts (always available, scoped to current context):

| Shortcut          | Action                                  |
| ----------------- | --------------------------------------- |
| `C`               | Create issue (focuses title field)      |
| `/`               | Open command palette                    |
| `G` then `B`      | Go to Board                             |
| `G` then `I`      | Go to Issues (list)                     |
| `G` then `A`      | Go to Activity                          |
| `?`               | Show keyboard shortcuts overlay         |
| `Esc`             | Close panel/modal; blur active field    |
| `J` / `K`         | Move selection down / up in a list      |
| `Enter` / `Space` | Open selected item                      |
| `Cmd/Ctrl+Enter`  | Submit current form                     |

**Rationale:** GitHub/Linear users expect `Cmd+K` and `J/K` navigation. We follow the
convention rather than invent one, because the audience already knows it.

## Information architecture

```
Jrello
└── Workspace            (tenancy boundary; billing & members live here)
    ├── Projects[]       (a product/codebase being built)
    │   ├── Board        (Kanban — the default working surface)
    │   ├── Issues       (list/table view; filterable, sortable)
    │   ├── Sprints      (planning & reports — Phase 5)
    │   ├── Activity     (project-wide event stream)
    │   ├── Members      (who's on this project)
    │   └── Settings      (project config, GitHub connection — Phase 7)
    ├── Members          (workspace roster)
    └── Settings         (workspace config)
```

- **Workspace** is the topmost tenancy. A user belongs to ≥1 workspace and switches
  between them via the **workspace switcher** in the sidebar.
- **Project** is the unit of work. A project has its own identifier prefix
  (`JREL`, `WEB`, `API`).
- **Issue** is the atomic work item, unique within a project, displayed as
  `PREFIX-number`.

## Navigation structure

### App shell (persistent)

```
┌─────────────────────────────────────────────────────────────────┐
│ [TopBar: workspace switcher · breadcrumb · cmd palette · user]  │
├──────────┬──────────────────────────────────────────────────────┤
│ Sidebar  │  Main content area                                    │
│          │                                                        │
│ Projects │  (board / list / detail / settings)                   │
│  · JREL  │                                                        │
│  · WEB   │                                                        │
│  · API   │                                                        │
│          │                                                        │
│ + New    │                                                        │
│ ──────   │                                                        │
│ Members  │                                                        │
│ Settings │                                                        │
└──────────┴──────────────────────────────────────────────────────┘
```

- The **left sidebar** is collapsible (`[` / `]` or a button). At narrow widths it
  becomes an overlay drawer.
- The **top bar** is thin, dense, and carries context (current workspace/project) plus
  global affordances (palette, notifications, user menu).
- The **main area** is the focus; it changes per route. It is never a blank page when
  there is data to show.

### Page hierarchy (routes)

| Route                                  | Surface                                          |
| -------------------------------------- | ------------------------------------------------ |
| `/login`, `/signup`                    | Auth (outside the shell)                         |
| `/onboarding`                          | First-run: create/join workspace + first project |
| `/[workspaceSlug]`                     | Default landing (redirects to last project)      |
| `/[workspaceSlug]/projects/[slug]`     | Project board (default)                          |
| `/[workspaceSlug]/projects/[slug]/board`   | Kanban                                        |
| `/[workspaceSlug]/projects/[slug]/issues`  | List view                                     |
| `/[workspaceSlug]/projects/[slug]/activity` | Activity feed                                |
| `/[workspaceSlug]/projects/[slug]/members`  | Project members                              |
| `/[workspaceSlug]/projects/[slug]/settings` | Project settings                             |
| `/[workspaceSlug]/issue/[key]`         | Issue detail (deep-linkable, command-palette-openable as panel) |
| `/[workspaceSlug]/settings`            | Workspace settings                               |
| `/[workspaceSlug]/members`             | Workspace members                                |

The issue detail is reachable **both** as a full route and as an overlaid panel from
the board — same component, two presentation modes.

## Main user journeys

### J1 — First-time user

1. Lands on `/signup`. GitHub or email.
2. After auth, `/onboarding`: "Create your workspace" (name, slug, project identifier).
3. "Create your first project" (name, prefix, default statuses pre-filled).
4. Lands on the empty board with a clear empty state and a primary CTA: *Add your first
   issue*. Pressing `C` does the same thing.

### J2 — Daily planning → execution (MVP)

1. Opens app → lands on the active project board (last visited).
2. Drags issues from *Backlog* into *In Progress* (or `J/K` + `Enter`).
3. Presses `C` to capture a new issue mid-standup.
4. Teammate's moves appear live (Socket.IO); a subtle presence indicator shows who's
   viewing the board.

### J3 — Issue lifecycle (full, post-GitHub integration)

1. Open issue `JREL-142` from palette.
2. Press *Start* → offered a branch name `JREL-142-short-title`.
3. Commits appear in the issue activity; PR is auto-linked when pushed.
4. CI status badge on the card reflects the latest check run.
5. On merge, issue auto-moves to *Done* (configurable per project).

### J4 — Invite a teammate

1. Workspace *Members* → *Invite*.
2. Enter email or GitHub handle; role selected (Member / Admin).
3. Invitee accepts (email link or in-app notification) and lands in the workspace.

## Page-level decisions

- **Board is the default project view**, not a dashboard. Dashboards are for managers;
  builders want their work surface. (A lightweight *Overview* exists per project but is
  not the landing page for daily work — see J2.)
- **Issue detail opens as a side panel** by default when clicked from the board, so the
  board context is never lost. It deep-links to a full route for sharing.
- **No "home/dashboard" landing page at the workspace level** in the MVP. After auth we
  go straight to the last-used project. A *project switcher* + *recents* lives in the
  sidebar.

## Loading / error / empty states

These states are **first-class**, not afterthoughts. They are part of the design system
and must be implemented, not skipped.

### Loading

- **Skeletons** that match the final layout shape (not spinners in a void) for initial
  page loads.
- **Optimistic updates** for mutations the user initiates (move card, rename) — UI
  updates immediately, with a subtle *saving* indicator; reverting on failure with an
  inline toast.
- **Inline progress** for longer operations (e.g., connecting a repo) with a real
  status message, not a generic spinner.

### Error

- **Never a blank screen.** Route-level error boundary renders a clear, recoverable
  state: what happened, a retry button, and (where relevant) a way to copy details.
- **Network errors** are shown as a non-blocking toast with a retry; the UI remains
  usable.
- **Form errors** appear inline next to the field, with the offending field focused.

### Empty

Every empty surface teaches the next action:

| Surface             | Empty state message + action                                    |
| ------------------- | --------------------------------------------------------------- |
| Board (no issues)   | "No issues yet. Press `C` or click *Add issue*." + CTA button   |
| Issues list         | "Nothing matches these filters. Clear filters / add issue."    |
| Activity            | "No activity yet. Activity appears here as the project moves."  |
| Members             | "You're the only one here. Invite a teammate."                  |
| Search results      | "No results for \"x\"." with recent searches                    |

## Responsiveness

- **Desktop (≥1280px):** full sidebar + board + side panel. The primary target.
- **Laptop (1024–1279px):** sidebar collapses to icons by default; expandable.
- **Tablet (768–1023px):** sidebar becomes an overlay drawer; board becomes a single
  column with horizontal swipe between columns.
- **Mobile (<768px):** a read-mostly experience — list view by default, board available
  but de-prioritized. We do not pretend mobile is a primary authoring surface.

We optimize for desktop because our users author on desktop. Mobile is a
read-and-acknowledge surface, not a first-class workspace.

## Accessibility

- All interactive elements are reachable and operable by keyboard with a visible focus
  ring (focus visible, not focus only).
- Color contrast meets WCAG AA against both themes.
- Drag-and-drop interactions have keyboard equivalents (selection + `L`/`R` to move
  columns, or the palette's *Move to* action).
- `aria-live` regions announce real-time changes (e.g., "Issue moved to In Progress by
  Alex") for screen-reader users.

## What Jrello's UX deliberately is **not**

- Not a dashboard-heavy manager tool.
- Not a configurable board for non-software teams.
- Not a maximalist, animation-rich "demo" UI. Motion serves understanding, not delight
  for its own sake.
