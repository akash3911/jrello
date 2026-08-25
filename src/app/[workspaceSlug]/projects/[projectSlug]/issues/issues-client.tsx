"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";
import { IssueDetailPanel } from "@/components/board/IssueDetailPanel";
import { relativeTime, initialsOf } from "@/lib/format";
import type { ProjectMemberClient } from "@/lib/types";
import type { PriorityLevel } from "@/components/ui/priority-badge";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  key: string;
  title: string;
  statusKind: StatusKind;
  priority: PriorityLevel;
  assignee: { id: string; name: string | null; avatarUrl: string | null } | null;
  estimate: number | null;
  commentsCount: number;
  updatedAt: string;
}

export default function IssuesListClient({
  rows,
  workspaceSlug,
  members,
}: {
  rows: Row[];
  workspaceSlug: string;
  members: ProjectMemberClient[];
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState("ALL");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [openKey, setOpenKey] = React.useState<string | null>(null);

  const filtered = React.useMemo(
    () =>
      rows.filter((r) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q || r.title.toLowerCase().includes(q) || r.key.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "ALL" || r.statusKind === statusFilter;
        const matchesPriority =
          priorityFilter === "ALL" || r.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      }),
    [rows, searchQuery, statusFilter, priorityFilter]
  );

  // Clamp selection when filters shrink the result set (no cascading state)
  const activeIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  // Keyboard nav
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
      ) {
        return;
      }
      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter" && filtered[activeIndex]) {
        e.preventDefault();
        setOpenKey(filtered[activeIndex].key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selectedIndex, activeIndex]);

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--bg-base)] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          <div className="flex max-w-sm flex-1 items-center gap-2">
            <Input
              id="issues-search"
              leftIcon={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search issues… (/)"
              className="h-8 bg-[var(--bg-raised)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2 text-xs text-[var(--text)] outline-none focus-ring"
            >
              <option value="ALL">All statuses</option>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2 text-xs text-[var(--text)] outline-none focus-ring"
            >
              <option value="ALL">All priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="NONE">None</option>
            </select>
            <Badge variant="mono" size="sm">
              {filtered.length} / {rows.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] shadow-[var(--shadow-xs)]">
          <div className="grid select-none grid-cols-[110px_1fr_120px_90px_150px_70px] items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-base)] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
            <span>Key</span>
            <span>Title</span>
            <span>Status</span>
            <span>Priority</span>
            <span className="text-right">Assignee</span>
            <span className="text-right">Updated</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-14 text-center text-xs font-mono-id text-[var(--text-muted)]">
              No issues match your filters.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]/60">
              {filtered.map((issue, index) => (
                <div
                  key={issue.id}
                  onClick={() => {
                    setSelectedIndex(index);
                    setOpenKey(issue.key);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  data-issue-id={issue.id}
                  className={cn(
                    "grid cursor-pointer grid-cols-[110px_1fr_120px_90px_150px_70px] items-center gap-3 px-4 py-2 text-xs transition-colors select-none",
                    index === activeIndex
                      ? "bg-[var(--accent-soft)]/60"
                      : "hover:bg-[var(--bg-overlay)]"
                  )}
                >
                  <span className="font-mono-id text-[11px] font-bold text-[var(--text-subtle)]">
                    {issue.key}
                  </span>
                  <span className="truncate font-medium text-[var(--text)]">
                    {issue.title}
                  </span>
                  <span>
                    <StatusBadge status={issue.statusKind} size="sm" />
                  </span>
                  <span>
                    <PriorityBadge priority={issue.priority} showLabel={false} size="sm" />
                  </span>
                  <span className="flex items-center justify-end gap-1.5 overflow-hidden">
                    {issue.assignee ? (
                      <>
                        <span className="max-w-24 truncate text-[11px] text-[var(--text-muted)]">
                          {issue.assignee.name ?? "Member"}
                        </span>
                        <Avatar
                          src={issue.assignee.avatarUrl}
                          fallback={initialsOf(issue.assignee.name)}
                          size="xs"
                        />
                      </>
                    ) : (
                      <span className="text-[11px] italic text-[var(--text-subtle)]">
                        Unassigned
                      </span>
                    )}
                  </span>
                  <span className="text-right font-mono-id text-[10px] text-[var(--text-subtle)]">
                    {relativeTime(issue.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-3 text-center font-mono-id text-[10px] text-[var(--text-subtle)]">
          J K navigate · Enter open · click any row for details
        </p>
      </div>

      {/* Detail panel */}
      <IssueDetailPanel
        issueKey={openKey}
        workspaceSlug={workspaceSlug}
        members={members}
        onClose={() => setOpenKey(null)}
        onChanged={() => {
          /* Server components re-fetch on refresh */
        }}
        onDeleted={() => setOpenKey(null)}
      />
    </div>
  );
}
