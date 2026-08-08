# Jrello — Product

> A developer-first project execution platform that connects Agile planning with the
> actual software development lifecycle.

Jrello is not a Trello clone and not a generic SaaS PM tool. It is the connective tissue
between an engineering team's **plan** (issues, sprints, kanban) and its **execution**
(branches, PRs, CI, deployments). The north star is that a developer's planning surface
already knows what code is moving — without copy-paste between tools.

---

## Product vision

Make the issue-to-deployment path a single, continuous, observable system. When a
developer picks up an issue, the branch exists, CI runs against it, the PR is linked,
and review/merge status flows back into the plan automatically. Planning stops being a
separate artifact from engineering reality.

The product should feel like a **native developer tool** (closer to Linear/GitHub) rather
than a business application that happens to be used by developers.

## Target users

- **Primary:** Small-to-mid engineering teams (2–40 people) who already live in Git.
- **Secondary:** Solo developers and indie teams who want planning without the ceremony
  of a heavyweight PM suite.
- **Tertiary:** Engineering managers / tech leads who need lightweight visibility into
  sprint progress and PR health.

We are **not** targeting: enterprise governance buyers, non-technical project managers,
cross-functional marketing/product ops teams, or "every team in the company" use cases.

## Problem

1. **Planning and execution live in different tools.** Issues are tracked in a PM tool;
   actual work happens in Git. Status drifts: an issue is "in progress" for days while
   the PR was merged hours ago.
2. **Context is lost at the boundary.** A developer manually links a branch, opens a PR,
   copies the issue ID, and posts status back. Every handoff is a place to forget.
3. **Existing PM tools are designed for managers, not builders.** They optimize for
   reporting dashboards and ceremony, not for the person writing code at 2am.
4. **Real-time collaboration is bolted on.** Most PM tools are read-mostly; changes are
   not visible to teammates live, so people duplicate work.

## Product positioning

| Axis               | Jrello                                                                              |
| ------------------ | ----------------------------------------------------------------------------------- |
| Closest cousin     | Linear (speed/density/keyboard-first) + GitHub (execution-native)                   |
| Differentiator     | The planning surface is wired into the dev lifecycle by default                      |
| Not                | A configurable board for any team; a Jira replacement for non-engineering orgs      |
| Pricing posture    | Developer-tool pricing, not enterprise-seat pricing (post-MVP decision)             |
| Distribution       | Product-led, developer-to-developer; GitHub sign-in and repo connect on first run   |

## Core workflows

```
Issue → Sprint → Kanban → GitHub Branch → Pull Request → CI → Review → Deployment
```

Detailed, end-to-end flow:

1. **Capture.** An issue is created (manually, via a quick-add command, or from a
   template). It gets a stable, human-readable identifier (`JREL-142`).
2. **Plan.** The issue is estimated and added to a sprint during planning.
3. **Start.** A developer drags it to *In Progress* (or hits a key). Jrello offers to
   create/associate a branch named after the issue.
4. **Execute.** Commits referencing the issue update the issue's activity feed. PR
   creation is detected (or initiated from the issue).
5. **Verify.** CI status appears on the issue card and in the activity feed.
6. **Review.** Reviewers, approvals, and requested changes are surfaced in Jrello.
7. **Ship.** Merge triggers the issue to move to *Done* (configurable), and deploy
   status links back to the issue.
8. **Reflect.** Sprint reports show cycle time, throughput, and carry-over.

## MVP scope (Phase 1–4)

The MVP is the **planning half** of the system, executed at a high quality bar:

- Workspaces & projects with membership.
- Auth (email + GitHub OAuth).
- Issues with rich metadata: status, assignee, priority, labels, estimates.
- Kanban board with drag-and-drop and keyboard control.
- Real-time updates across viewers (Socket.IO).
- Activity feed per issue.

**The MVP deliberately does not include** the GitHub execution wiring — that is what
makes Jrello distinctive, but it depends on the planning core being correct first. The
MVP must be a planning tool good enough that a developer would choose it on its own.

## Future scope (Phase 5–9)

- **Sprints** with velocity, carry-over, and planning view.
- **GitHub integration:** repo connect, branch/PR association, webhooks, CI status,
  deploy status, issue-state automation on merge.
- **Automation:** rules engine (e.g., "when PR merged → move to Done", "when blocked →
  notify lead").
- **Search & command palette** across issues, projects, and repos.
- **Deployment/production hardening:** rate limits, audit logging, backups, monitoring.

## Explicit non-goals

- **No multi-tenant business configuration.** We are not a generic workflow engine.
  Workflows are software-delivery-shaped, not user-moldable.
- **No Gantt charts / portfolio roadmaps** in the foreseeable future. They serve a
  different audience.
- **No native mobile app.** Responsive web only.
- **No "AI summary" features stapled on.** If AI appears, it must earn its place.
- **No self-hosted enterprise edition** for the foreseeable future. Hosted product
  first; self-hosting is a distraction from the core.
- **No competing with Linear on speed-of-light polish in v1.** We aim for *good and
  intentional*, not for beating Linear at its own game on day one.

## Success criteria for the MVP

- A developer can create a workspace, invite one teammate, create a project, add issues,
  and move them across a board — and the second person sees it live.
- Every action is reachable by keyboard within two keystrokes from anywhere.
- First contentful paint on the board is fast enough to feel instant on a warm load.
- The visual design is unmistakably *not generic SaaS* — a developer should look at it
  and believe it was built by someone who uses developer tools.
