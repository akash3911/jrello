"use client";

import * as React from "react";
import { AppShell } from "@/components/shell/AppShell";
import { KanbanBoard, type StatusColumnData } from "@/components/board/KanbanBoard";
import { type KanbanIssueItem } from "@/components/board/KanbanCard";

const initialStatuses: StatusColumnData[] = [
  { id: "st-backlog", name: "Backlog", kind: "BACKLOG", position: 1000 },
  { id: "st-todo", name: "Todo", kind: "TODO", position: 2000, isDefault: true },
  { id: "st-inprogress", name: "In Progress", kind: "IN_PROGRESS", position: 3000 },
  { id: "st-inreview", name: "In Review", kind: "IN_REVIEW", position: 4000 },
  { id: "st-done", name: "Done", kind: "DONE", position: 5000 },
];

const initialIssues: KanbanIssueItem[] = [
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
    branchName: "feat/jrel-103-ui-tokens",
    commentsCount: 1,
    createdAt: "Today",
    updatedAt: "15m ago",
    estimate: "3 pts",
  },
  {
    id: "4",
    key: "JREL-104",
    title: "Clerk authentication integration & user webhook sync",
    description:
      "Integrate ClerkProvider, protected routes via proxy middleware, styled sign-in/up routes, and svix webhook synchronization to local PostgreSQL database mirror.",
    status: "DONE",
    priority: "HIGH",
    assignee: { name: "Akash", initials: "AK" },
    labels: ["auth", "backend"],
    branchName: "feat/jrel-104-clerk-auth",
    commentsCount: 3,
    createdAt: "Today",
    updatedAt: "Just now",
    estimate: "5 pts",
  },
  {
    id: "5",
    key: "JREL-105",
    title: "Projects & Issues domain CRUD, numbering, and midpoint sort order",
    description:
      "Add transactional MAX(number)+1 allocation, sortOrder midpoint calculation for drag-and-drop, dense list view, and settings.",
    status: "DONE",
    priority: "URGENT",
    assignee: { name: "Sarah Chen", initials: "SC" },
    labels: ["database", "api"],
    branchName: "feat/jrel-105-issues-crud",
    commentsCount: 0,
    createdAt: "Today",
    updatedAt: "Just now",
    estimate: "5 pts",
  },
  {
    id: "6",
    key: "JREL-106",
    title: "Interactive Kanban board: drag-and-drop, optimistic updates, and keyboard J/K/L/H",
    description:
      "Implement full HTML5 drag-and-drop between columns, keyboard move parity, quick card composer (C), and slide-over issue detail panel.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    assignee: { name: "Akash", initials: "AK" },
    labels: ["kanban", "frontend"],
    branchName: "feat/jrel-106-kanban-board",
    commentsCount: 2,
    createdAt: "Today",
    updatedAt: "Active",
    estimate: "5 pts",
  },
  {
    id: "7",
    key: "JREL-107",
    title: "Sprint planning and velocity/throughput reports",
    description:
      "Sprint state machine (planned/active/completed), backlog planning view, active sprint board filter, and derived velocity metrics.",
    status: "TODO",
    priority: "MEDIUM",
    assignee: { name: "Alex Mercer", initials: "AM" },
    labels: ["sprints", "planning"],
    branchName: "feat/jrel-107-sprints",
    commentsCount: 0,
    createdAt: "Today",
    updatedAt: "1h ago",
    estimate: "3 pts",
  },
  {
    id: "8",
    key: "JREL-108",
    title: "Real-time presence and Socket.IO collaboration engine",
    description:
      "WebSocket server for board broadcast, optimistic reconciliation, and cursor presence indicator.",
    status: "BACKLOG",
    priority: "LOW",
    assignee: { name: "Unassigned", initials: "UA" },
    labels: ["realtime", "socket.io"],
    branchName: "feat/jrel-108-realtime",
    commentsCount: 0,
    createdAt: "Today",
    updatedAt: "3h ago",
    estimate: "8 pts",
  },
];

export default function Home() {
  return (
    <AppShell>
      <KanbanBoard
        projectKey="JREL"
        projectName="Jrello Core Platform"
        projectDescription="Engineering workspace board. Use drag-and-drop or J/K/L/H to move cards, C to quick-add, Enter to inspect."
        workspaceSlug="acme-eng"
        initialStatuses={initialStatuses}
        initialIssues={initialIssues}
        currentUser={{
          id: "me",
          name: "Akash",
          avatarUrl: null,
        }}
      />
    </AppShell>
  );
}
