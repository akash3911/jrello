"use client";

import * as React from "react";
import { Plus, Search, ListTodo } from "lucide-react";
import { AppShell, type IssueCreatePayload } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";
import {
  IssueDetailPanel,
  type IssueItem,
} from "@/components/board/IssueDetailPanel";

const initialIssues: IssueItem[] = [
  {
    id: "1",
    key: "JREL-101",
    title: "Scaffold Next.js 16 + Tailwind CSS design tokens & CSS variables",
    description:
      "Initialize Next.js with App Router, TypeScript, Inter + JetBrains Mono font pairing, and implement all tokens from DESIGN-SYSTEM.md as CSS variables for light/dark modes.",
    status: "DONE",
    priority: "HIGH",
    assignee: { name: "Akash", initials: "AK" },
    labels: ["foundation", "frontend"],
    branchName: "feat/jrel-101-nextjs-tokens",
    commentsCount: 4,
    createdAt: "Today",
    updatedAt: "Just now",
    estimate: "3 pts",
  },
  {
    id: "2",
    key: "JREL-102",
    title: "PostgreSQL 15 container in WSL & Prisma schema migration",
    description:
      "Run PostgreSQL 15 container via Docker Compose in WSL, configure prisma/schema.prisma with Clerk-mirrored User model and foundational enums.",
    status: "DONE",
    priority: "URGENT",
    assignee: { name: "Sarah Chen", initials: "SC" },
    labels: ["database", "backend"],
    branchName: "feat/jrel-102-postgres-prisma",
    commentsCount: 2,
    createdAt: "Today",
    updatedAt: "10m ago",
    estimate: "2 pts",
  },
  {
    id: "3",
    key: "JREL-103",
    title: "Restyle shadcn/ui primitives to exact design tokens",
    description:
      "Build Button, Input, Badge, Separator, Avatar, Card, PriorityBadge, and StatusBadge without generic SaaS gradients or pillowy corners.",
    status: "DONE",
    priority: "HIGH",
    assignee: { name: "Alex Mercer", initials: "AM" },
    labels: ["ui-kit", "design-system"],
    branchName: "feat/jrel-103-primitive-tokens",
    commentsCount: 3,
    createdAt: "Today",
    updatedAt: "5m ago",
    estimate: "3 pts",
  },
  {
    id: "4",
    key: "JREL-104",
    title: "AppShell with 4 responsive breakpoints & global keyboard shortcuts",
    description:
      "Build persistent shell with collapsible sidebar (desktop >=1280, laptop 1024-1279, tablet 768-1023, mobile <768), Topbar, CommandPalette (Cmd+K), and shortcuts overlay (?).",
    status: "IN_PROGRESS",
    priority: "URGENT",
    assignee: { name: "Akash", initials: "AK" },
    labels: ["shell", "ux"],
    branchName: "feat/jrel-104-app-shell-shortcuts",
    commentsCount: 5,
    createdAt: "Today",
    updatedAt: "Active",
    estimate: "5 pts",
  },
  {
    id: "5",
    key: "JREL-105",
    title: "Design System & Component Gallery at /dev route",
    description:
      "Create interactive /dev page rendering type scale, color palettes, button matrix, badge variants, form controls, and anti-slop verification checklist.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignee: { name: "Marcus Brody", initials: "MB" },
    labels: ["gallery", "dev-tools"],
    branchName: "feat/jrel-105-dev-gallery",
    commentsCount: 1,
    createdAt: "Today",
    updatedAt: "Active",
    estimate: "2 pts",
  },
  {
    id: "6",
    key: "JREL-106",
    title: "ClerkProvider & webhook user sync mirror (Phase 2)",
    description:
      "Set up Clerk auth provider, proxy.ts middleware, and /api/webhooks/clerk to sync user rows into Postgres without local passwords.",
    status: "TODO",
    priority: "HIGH",
    assignee: { name: "Sarah Chen", initials: "SC" },
    labels: ["auth", "clerk"],
    branchName: "feat/jrel-106-clerk-integration",
    commentsCount: 0,
    createdAt: "Today",
    updatedAt: "1h ago",
    estimate: "5 pts",
  },
  {
    id: "7",
    key: "JREL-107",
    title: "Workspace tenancy & project onboarding wizard",
    description:
      "First-run flow at /onboarding to create workspace, assign roles, and seed initial project identifier (e.g. JREL).",
    status: "TODO",
    priority: "MEDIUM",
    assignee: { name: "Alex Mercer", initials: "AM" },
    labels: ["onboarding", "tenancy"],
    branchName: "feat/jrel-107-workspace-onboarding",
    commentsCount: 0,
    createdAt: "Today",
    updatedAt: "2h ago",
    estimate: "3 pts",
  },
  {
    id: "8",
    key: "JREL-108",
    title: "Socket.IO real-time event engine & optimistic board updates (Phase 6)",
    description:
      "Implement real-time card move broadcasts, presence cursor indicators, and optimistic rollback on connection drop.",
    status: "BACKLOG",
    priority: "LOW",
    assignee: { name: "Marcus Brody", initials: "MB" },
    labels: ["realtime", "websocket"],
    branchName: "feat/jrel-108-socketio-presence",
    commentsCount: 0,
    createdAt: "Yesterday",
    updatedAt: "1d ago",
    estimate: "8 pts",
  },
  {
    id: "9",
    key: "JREL-109",
    title: "GitHub App webhooks & PR-linked branch tracking (Phase 7)",
    description:
      "Auto-link branches, render latest check run status on cards, and auto-move issues to Done on pull request merge.",
    status: "BACKLOG",
    priority: "NONE",
    assignee: { name: "Akash", initials: "AK" },
    labels: ["github", "integrations"],
    branchName: "feat/jrel-109-github-sync",
    commentsCount: 0,
    createdAt: "Yesterday",
    updatedAt: "1d ago",
    estimate: "8 pts",
  },
];

const columns: { kind: StatusKind; title: string; subtitle: string }[] = [
  { kind: "BACKLOG", title: "Backlog", subtitle: "Ideas & unestimated work" },
  { kind: "TODO", title: "Todo", subtitle: "Ready for development" },
  { kind: "IN_PROGRESS", title: "In Progress", subtitle: "Active branches" },
  { kind: "IN_REVIEW", title: "In Review", subtitle: "PRs & code review" },
  { kind: "DONE", title: "Done", subtitle: "Merged to main" },
];

export default function HomePage() {
  const [issues, setIssues] = React.useState<IssueItem[]>(initialIssues);
  const [selectedIssue, setSelectedIssue] = React.useState<IssueItem | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");
  const [showEmptyStates, setShowEmptyStates] = React.useState(false);
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  const filteredIssues = React.useMemo(() => {
    if (showEmptyStates) return [];
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.labels.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority =
        priorityFilter === "ALL" || issue.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [issues, searchQuery, priorityFilter, showEmptyStates]);

  const handleCreateIssueSubmit = (newIssueData: IssueCreatePayload) => {
    const nextNumber = issues.length + 101;
    const newIssue: IssueItem = {
      id: `issue-${nextNumber}`,
      key: `JREL-${nextNumber}`,
      title: newIssueData.title,
      description: newIssueData.description || "Captured from quick composer.",
      status: newIssueData.status,
      priority: newIssueData.priority,
      assignee: { name: "Akash", initials: "AK" },
      labels: ["feature"],
      branchName: `feat/jrel-${nextNumber}-${newIssueData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 25)}`,
      commentsCount: 0,
      createdAt: "Just now",
      updatedAt: "Just now",
      estimate: newIssueData.estimate || "3 pts",
    };

    setIssues((prev) => [newIssue, ...prev]);
  };

  const handleMoveIssue = (issueId: string, targetStatus: StatusKind) => {
    setIssues((prev) =>
      prev.map((item) =>
        item.id === issueId ? { ...item, status: targetStatus, updatedAt: "Just now" } : item
      )
    );
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue((prev) => (prev ? { ...prev, status: targetStatus } : null));
    }
  };

  return (
    <AppShell onCreateIssueSubmit={handleCreateIssueSubmit}>
      <div className="flex h-full flex-col min-w-0 bg-[var(--bg-base)]">
        {/* Project Header Bar */}
        <div className="flex flex-col gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-base)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-fg)] font-mono-id font-bold text-sm">
                JREL
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-[var(--text)] tracking-tight">
                    Jrello Core
                  </h1>
                  <Badge variant="accent" size="sm">
                    Sprint 1 (Active)
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Developer-first issue tracker with Next.js 16, PostgreSQL 15, and Tailwind tokens.
                </p>
              </div>
            </div>

            {/* Quick Demo Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={showSkeleton ? "primary" : "secondary"}
                size="sm"
                onClick={() => setShowSkeleton((prev) => !prev)}
                className="text-xs font-mono-id"
                title="Toggle Skeleton Loading State"
              >
                Skeleton Mode
              </Button>

              <Button
                variant={showEmptyStates ? "danger" : "secondary"}
                size="sm"
                onClick={() => setShowEmptyStates((prev) => !prev)}
                className="text-xs font-mono-id"
                title="Toggle Empty Board State"
              >
                {showEmptyStates ? "Reset Issues" : "Empty State"}
              </Button>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Input
                leftIcon={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter issues by key, title, or label (press /)..."
                className="h-8 text-xs bg-[var(--bg-raised)]"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Priority filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 text-xs text-[var(--text)] focus-ring outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent (Red)</option>
                <option value="HIGH">High (Orange)</option>
                <option value="MEDIUM">Medium (Yellow)</option>
                <option value="LOW">Low (Blue)</option>
                <option value="NONE">No Priority</option>
              </select>

              <span className="text-xs font-mono-id text-[var(--text-subtle)] pl-1">
                {filteredIssues.length} issues
              </span>
            </div>
          </div>
        </div>

        {/* Board Columns Container */}
        <div className="flex-1 overflow-x-auto p-6 bg-[var(--bg-base)]">
          {showSkeleton ? (
            /* Skeleton Loading State per UX.md §Loading */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-[1100px] h-full">
              {columns.map((col) => (
                <div
                  key={col.kind}
                  className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)]/40 p-3 h-full animate-pulse"
                >
                  <div className="h-6 w-24 bg-[var(--border)] rounded" />
                  <div className="h-24 bg-[var(--border)]/60 rounded-[var(--radius-md)]" />
                  <div className="h-24 bg-[var(--border)]/60 rounded-[var(--radius-md)]" />
                  <div className="h-24 bg-[var(--border)]/60 rounded-[var(--radius-md)]" />
                </div>
              ))}
            </div>
          ) : showEmptyStates ? (
            /* Empty State per UX.md §Empty */
            <div className="flex flex-col items-center justify-center h-96 border border-dashed border-[var(--border-strong)] rounded-[var(--radius-lg)] bg-[var(--bg-raised)]/30 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] mb-3">
                <ListTodo className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-semibold text-[var(--text)]">
                No issues yet on this board
              </h2>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1 mb-4">
                Capture tasks, bugs, and features for Sprint 1. Press <kbd className="px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-base)] font-mono-id text-[10px]">C</kbd> or click below to start.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowEmptyStates(false)}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Issue
              </Button>
            </div>
          ) : (
            /* Kanban Board Columns */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-[1100px] items-start pb-6">
              {columns.map((col) => {
                const colIssues = filteredIssues.filter(
                  (i) => i.status === col.kind
                );

                return (
                  <div
                    key={col.kind}
                    className="flex flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)]/60 min-h-[500px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)] bg-[var(--bg-raised)]">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={col.kind} showLabel={false} size="sm" />
                        <span className="text-xs font-semibold text-[var(--text)]">
                          {col.title}
                        </span>
                        <span className="font-mono-id text-[11px] text-[var(--text-subtle)]">
                          {colIssues.length}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCreateIssueSubmit({
                            title: `New task in ${col.title}`,
                            description: "",
                            status: col.kind,
                            priority: "MEDIUM",
                            estimate: "3 pts",
                          })
                        }
                        className="h-6 w-6 text-[var(--text-subtle)] hover:text-[var(--text)]"
                        title={`Add issue to ${col.title}`}
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>

                    {/* Column Cards List */}
                    <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
                      {colIssues.length === 0 ? (
                        <div className="py-8 text-center text-[11px] text-[var(--text-subtle)] font-mono-id">
                          No issues
                        </div>
                      ) : (
                        colIssues.map((issue) => (
                          <Card
                            key={issue.id}
                            onClick={() => setSelectedIssue(issue)}
                            className="p-3 flex flex-col gap-2 cursor-pointer hover:border-[var(--border-strong)] transition-all select-none"
                          >
                            {/* Card Top: Key & Priority */}
                            <div className="flex items-center justify-between">
                              <Badge variant="mono" size="sm">
                                {issue.key}
                              </Badge>
                              <PriorityBadge priority={issue.priority} showLabel={false} size="sm" />
                            </div>

                            {/* Card Title */}
                            <h3 className="text-xs font-medium text-[var(--text)] leading-snug">
                              {issue.title}
                            </h3>

                            {/* Card Footer: Assignee & Estimation */}
                            <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]/50 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <Avatar
                                  fallback={issue.assignee.initials}
                                  size="xs"
                                  className="bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                                />
                                <span className="text-[var(--text-muted)] text-[11px]">
                                  {issue.assignee.name}
                                </span>
                              </div>

                              <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
                                {issue.estimate}
                              </span>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Slide-over Issue Detail Panel */}
        <IssueDetailPanel
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdateStatus={(newStatus) => {
            if (selectedIssue) {
              handleMoveIssue(selectedIssue.id, newStatus);
            }
          }}
        />
      </div>
    </AppShell>
  );
}
