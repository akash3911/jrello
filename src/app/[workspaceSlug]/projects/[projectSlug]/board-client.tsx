"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { AppShell, type IssueCreatePayload } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, type PriorityLevel } from "@/components/ui/priority-badge";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";
import {
  IssueDetailPanel,
  type IssueItem,
} from "@/components/board/IssueDetailPanel";

export interface StatusData {
  id: string;
  projectId: string;
  name: string;
  kind: StatusKind;
  position: number;
  isDefault: boolean;
}

export interface IssueAssigneeData {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface IssueData {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: StatusData;
  priority: PriorityLevel;
  assignee: IssueAssigneeData | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  estimate: number | null;
}

export interface ProjectData {
  id: string;
  name: string;
  key: string;
  slug: string;
  description: string | null;
  statuses: StatusData[];
  issues: IssueData[];
}

export interface CurrentUserData {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface ProjectBoardClientProps {
  project: ProjectData;
  workspaceSlug: string;
  currentUser: CurrentUserData | null;
}

export default function ProjectBoardClient({
  project,
  workspaceSlug,
  currentUser,
}: ProjectBoardClientProps) {
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");

  const filteredIssues = React.useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.key.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === "ALL" || issue.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [issues, searchQuery, priorityFilter]);

  const handleCreateIssueSubmit = (newIssueData: IssueCreatePayload) => {
    const nextNumber = issues.length + 101;
    const newIssue: IssueItem = {
      id: `issue-${nextNumber}`,
      key: `${project.key}-${nextNumber}`,
      title: newIssueData.title,
      description: newIssueData.description || "Created from board composer.",
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

  const statuses = project.statuses || [];

  return (
    <AppShell onCreateIssueSubmit={handleCreateIssueSubmit}>
      <div className="flex h-full flex-col min-w-0 bg-[var(--bg-base)]">
        {/* Project Header Bar */}
        <div className="flex flex-col gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-base)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-fg)] font-mono-id font-bold text-sm">
                {project.key}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-[var(--text)] tracking-tight">
                    {project.name}
                  </h1>
                  <Badge variant="accent" size="sm">
                    {project.key}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {project.description || `Active board in ${workspaceSlug}.`}
                </p>
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Input
                leftIcon={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter issues by key or title (press /)..."
                className="h-8 text-xs bg-[var(--bg-raised)]"
              />
            </div>

            <div className="flex items-center gap-2">
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

        {/* Board Columns */}
        <div className="flex-1 overflow-x-auto p-6 bg-[var(--bg-base)]">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-[1100px] items-start pb-6">
            {statuses.map((st) => {
              const colIssues = filteredIssues.filter(
                (i) => i.status === st.kind
              );

              return (
                <div
                  key={st.id}
                  className="flex flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)]/60 min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)] bg-[var(--bg-raised)]">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={st.kind} showLabel={false} size="sm" />
                      <span className="text-xs font-semibold text-[var(--text)]">
                        {st.name}
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
                          title: `New task in ${st.name}`,
                          description: "",
                          status: st.kind,
                          priority: "MEDIUM",
                          estimate: "3 pts",
                        })
                      }
                      className="h-6 w-6 text-[var(--text-subtle)] hover:text-[var(--text)]"
                      title={`Add issue to ${st.name}`}
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
                          <div className="flex items-center justify-between">
                            <Badge variant="mono" size="sm">
                              {issue.key}
                            </Badge>
                            <PriorityBadge priority={issue.priority} showLabel={false} size="sm" />
                          </div>

                          <h3 className="text-xs font-medium text-[var(--text)] leading-snug">
                            {issue.title}
                          </h3>

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
