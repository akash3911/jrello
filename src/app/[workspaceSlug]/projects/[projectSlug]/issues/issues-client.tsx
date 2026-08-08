"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { AppShell, type IssueCreatePayload } from "@/components/shell/AppShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";
import {
  IssueDetailPanel,
  type IssueItem,
} from "@/components/board/IssueDetailPanel";
import {
  type ProjectData,
  type CurrentUserData,
} from "../board-client";
import { cn } from "@/lib/utils";

interface IssuesListClientProps {
  project: ProjectData;
  workspaceSlug: string;
  currentUser: CurrentUserData | null;
}

export default function ProjectIssuesListClient({
  project,
  currentUser,
}: IssuesListClientProps) {
  const [issues, setIssues] = React.useState<IssueItem[]>(() => {
    return (project.issues || []).map((i) => ({
      id: i.id,
      key: `${project.key}-${i.number}`,
      title: i.title,
      description: i.description || "",
      status: i.status.kind,
      priority: i.priority,
      assignee: i.assignee
        ? {
            name: i.assignee.name || "User",
            avatar: i.assignee.avatarUrl,
            initials: (i.assignee.name || "U").slice(0, 2).toUpperCase(),
          }
        : { name: "Unassigned", initials: "UA" },
      labels: ["project"],
      branchName: `feat/${project.key.toLowerCase()}-${i.number}`,
      commentsCount: 0,
      createdAt: new Date(i.createdAt).toLocaleDateString(),
      updatedAt: new Date(i.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      estimate: i.estimate ? `${i.estimate} pts` : "3 pts",
    }));
  });

  const [selectedIssue, setSelectedIssue] = React.useState<IssueItem | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");

  const filteredIssues = React.useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.key.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || issue.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || issue.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [issues, searchQuery, statusFilter, priorityFilter]);

  // Keyboard navigation for table rows (J/K and Enter)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, filteredIssues.length - 1)));
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Enter" && filteredIssues[selectedIndex]) {
        e.preventDefault();
        setSelectedIssue(filteredIssues[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredIssues, selectedIndex]);

  const handleCreateIssueSubmit = (newIssueData: IssueCreatePayload) => {
    const nextNumber = issues.length + 101;
    const newIssue: IssueItem = {
      id: `issue-${nextNumber}`,
      key: `${project.key}-${nextNumber}`,
      title: newIssueData.title,
      description: newIssueData.description || "Created from list composer.",
      status: newIssueData.status,
      priority: newIssueData.priority,
      assignee: currentUser
        ? {
            name: currentUser.name || "You",
            initials: (currentUser.name || "ME").slice(0, 2).toUpperCase(),
          }
        : { name: "Assignee", initials: "ME" },
      labels: ["feature"],
      branchName: `feat/${project.key.toLowerCase()}-${nextNumber}`,
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
        {/* List Header */}
        <div className="flex flex-col gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-base)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-fg)] font-mono-id font-bold text-sm">
                {project.key}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-[var(--text)] tracking-tight">
                    {project.name} Issues
                  </h1>
                  <Badge variant="mono" size="sm">
                    {filteredIssues.length} Items
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Filterable list view. Use <kbd className="px-1 py-0.5 rounded border border-[var(--border)] font-mono-id text-[10px]">J</kbd> / <kbd className="px-1 py-0.5 rounded border border-[var(--border)] font-mono-id text-[10px]">K</kbd> to navigate, <kbd className="px-1 py-0.5 rounded border border-[var(--border)] font-mono-id text-[10px]">Enter</kbd> to open.
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Input
                leftIcon={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues in this project (press /)..."
                className="h-8 text-xs bg-[var(--bg-raised)]"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 text-xs text-[var(--text)] focus-ring outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 text-xs text-[var(--text)] focus-ring outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="NONE">None</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dense Table Container (32–36px rows per DESIGN-SYSTEM.md) */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] overflow-hidden shadow-none">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-base)] text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider select-none">
              <div className="col-span-2">Key</div>
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-2 text-right">Assignee</div>
            </div>

            {/* Table Rows */}
            {filteredIssues.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)] font-mono-id">
                No issues match your current filters.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]/50">
                {filteredIssues.map((issue, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={issue.id}
                      onClick={() => {
                        setSelectedIndex(index);
                        setSelectedIssue(issue);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "grid grid-cols-12 gap-3 px-4 py-2.5 text-xs items-center cursor-pointer transition-colors select-none",
                        isSelected
                          ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                          : "hover:bg-[var(--bg-overlay)] text-[var(--text)]"
                      )}
                    >
                      {/* Key */}
                      <div className="col-span-2 flex items-center gap-1.5">
                        <Badge variant="mono" size="sm">
                          {issue.key}
                        </Badge>
                      </div>

                      {/* Title */}
                      <div className="col-span-5 truncate font-medium">
                        {issue.title}
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <StatusBadge status={issue.status} size="sm" />
                      </div>

                      {/* Priority */}
                      <div className="col-span-1">
                        <PriorityBadge priority={issue.priority} showLabel={false} size="sm" />
                      </div>

                      {/* Assignee */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        <span className="text-[11px] text-[var(--text-muted)] truncate">
                          {issue.assignee.name}
                        </span>
                        <Avatar
                          fallback={issue.assignee.initials}
                          size="xs"
                          className="bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
