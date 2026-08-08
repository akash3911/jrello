"use client";

import * as React from "react";
import Link from "next/link";
import { Play, CheckCircle2, Plus, ArrowRight, BarChart3 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PriorityBadge, type PriorityLevel } from "@/components/ui/priority-badge";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";
import { type CurrentUserData } from "../board-client";

export interface SprintIssueItem {
  id: string;
  number: number;
  title: string;
  estimate: number | null;
  priority: PriorityLevel;
  status: {
    name: string;
    kind: StatusKind;
  };
  sprintId: string | null;
}

export interface SprintItem {
  id: string;
  name: string;
  goal: string | null;
  state: "PLANNED" | "ACTIVE" | "COMPLETED";
  startDate: string | Date;
  endDate: string | Date;
  issues: SprintIssueItem[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  slug: string;
}

interface SprintPlanningClientProps {
  project: ProjectSummary;
  sprints: SprintItem[];
  backlogIssues: SprintIssueItem[];
  workspaceSlug: string;
  currentUser: CurrentUserData | null;
}

export default function SprintPlanningClient({
  project,
  sprints: initialSprints,
  backlogIssues: initialBacklog,
  workspaceSlug,
}: SprintPlanningClientProps) {
  const [sprints, setSprints] = React.useState<SprintItem[]>(initialSprints);
  const [backlogIssues, setBacklogIssues] = React.useState<SprintIssueItem[]>(
    initialBacklog.filter((i) => !i.sprintId)
  );

  const [isCreatingSprint, setIsCreatingSprint] = React.useState(false);
  const [sprintName, setSprintName] = React.useState(`Sprint ${sprints.length + 1}`);
  const [sprintGoal, setSprintGoal] = React.useState("Deliver MVP milestones and improve velocity");

  const activeSprint = sprints.find((s) => s.state === "ACTIVE");
  const plannedSprints = sprints.filter((s) => s.state === "PLANNED");

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date();
    const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks

    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${project.slug}/sprints`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: sprintName,
            goal: sprintGoal,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSprints((prev) => [data.sprint, ...prev]);
        setIsCreatingSprint(false);
        setSprintName(`Sprint ${sprints.length + 2}`);
      }
    } catch (err) {
      console.error("Failed to create sprint:", err);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${project.slug}/sprints/${sprintId}/start`,
        { method: "POST" }
      );

      if (res.ok) {
        setSprints((prev) =>
          prev.map((s) => (s.id === sprintId ? { ...s, state: "ACTIVE" } : s))
        );
      }
    } catch (err) {
      console.error("Failed to start sprint:", err);
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${project.slug}/sprints/${sprintId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incompleteAction: "backlog" }),
        }
      );

      if (res.ok) {
        setSprints((prev) =>
          prev.map((s) => (s.id === sprintId ? { ...s, state: "COMPLETED" } : s))
        );
      }
    } catch (err) {
      console.error("Failed to complete sprint:", err);
    }
  };

  const handleMoveToSprint = (issue: SprintIssueItem, targetSprintId: string) => {
    setBacklogIssues((prev) => prev.filter((i) => i.id !== issue.id));
    setSprints((prev) =>
      prev.map((s) =>
        s.id === targetSprintId
          ? { ...s, issues: [...(s.issues || []), { ...issue, sprintId: targetSprintId }] }
          : s
      )
    );
  };

  const handleMoveToBacklog = (issue: SprintIssueItem, fromSprintId: string) => {
    setSprints((prev) =>
      prev.map((s) =>
        s.id === fromSprintId
          ? { ...s, issues: (s.issues || []).filter((i) => i.id !== issue.id) }
          : s
      )
    );
    setBacklogIssues((prev) => [...prev, { ...issue, sprintId: null }]);
  };

  return (
    <AppShell>
      <div className="flex h-full flex-col min-w-0 bg-[var(--bg-base)] overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-fg)] font-mono-id font-bold text-sm">
                SP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-[var(--text)] tracking-tight">
                    Sprint Planning
                  </h1>
                  <Badge variant="mono" size="sm">
                    {project.key}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Time-boxed iterations, sprint backlog allocation, and velocity planning.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/${workspaceSlug}/projects/${project.slug}/sprints/reports`}>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <BarChart3 className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>Velocity Report</span>
                </Button>
              </Link>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreatingSprint(true)}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Sprint</span>
              </Button>
            </div>
          </div>

          {/* New Sprint Modal/Card */}
          {isCreatingSprint && (
            <form
              onSubmit={handleCreateSprint}
              className="p-5 rounded-[var(--radius-md)] border border-[var(--accent)] bg-[var(--bg-raised)] shadow-[var(--shadow-sm)] flex flex-col gap-4 animate-in fade-in"
            >
              <h2 className="text-sm font-semibold text-[var(--text)]">
                Plan New 2-Week Sprint
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                    Sprint Name
                  </label>
                  <input
                    type="text"
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    required
                    className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2.5 text-xs text-[var(--text)] focus-ring outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                    Sprint Goal
                  </label>
                  <input
                    type="text"
                    value={sprintGoal}
                    onChange={(e) => setSprintGoal(e.target.value)}
                    className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2.5 text-xs text-[var(--text)] focus-ring outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsCreatingSprint(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" className="text-xs">
                  Save Sprint
                </Button>
              </div>
            </form>
          )}

          {/* Active Sprint Section */}
          {activeSprint ? (
            <div className="p-5 rounded-[var(--radius-md)] border border-[var(--accent)] bg-[var(--bg-raised)] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="accent" size="sm">
                    ACTIVE SPRINT
                  </Badge>
                  <h2 className="text-sm font-semibold text-[var(--text)]">
                    {activeSprint.name}
                  </h2>
                  <span className="text-xs text-[var(--text-subtle)]">
                    ({activeSprint.issues?.length || 0} issues •{" "}
                    {(activeSprint.issues || []).reduce((sum, i) => sum + (i.estimate || 3), 0)} pts)
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCompleteSprint(activeSprint.id)}
                  className="gap-1.5 text-xs bg-[var(--success)] hover:bg-[var(--success-hover)]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Complete Sprint</span>
                </Button>
              </div>

              {activeSprint.goal && (
                <p className="text-xs text-[var(--text-muted)] italic">
                  Goal: {activeSprint.goal}
                </p>
              )}

              {/* Active Sprint Issues */}
              <div className="flex flex-col gap-2 pt-2">
                {(activeSprint.issues || []).length === 0 ? (
                  <p className="text-xs text-[var(--text-subtle)] py-4 font-mono-id">
                    No issues allocated. Drag or allocate issues from the backlog below.
                  </p>
                ) : (
                  (activeSprint.issues || []).map((issue) => (
                    <Card
                      key={issue.id}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="mono" size="sm">
                          {project.key}-{issue.number}
                        </Badge>
                        <span className="font-medium text-[var(--text)]">
                          {issue.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={issue.status?.kind || "TODO"} size="sm" />
                        <PriorityBadge priority={issue.priority || "MEDIUM"} showLabel={false} size="sm" />
                        <span className="font-mono-id text-[11px] text-[var(--text-subtle)]">
                          {issue.estimate || 3} pts
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveToBacklog(issue, activeSprint.id)}
                          className="h-6 text-[10px] px-2 text-[var(--text-subtle)]"
                        >
                          Backlog
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-raised)]/40 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-xs font-semibold text-[var(--text)]">
                  No Active Sprint
                </h3>
                <p className="text-xs text-[var(--text-subtle)] mt-0.5">
                  Select a planned sprint below and click Start Sprint to begin a time-boxed iteration.
                </p>
              </div>

              {plannedSprints[0] && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartSprint(plannedSprints[0].id)}
                  className="gap-1.5 text-xs"
                >
                  <Play className="h-3 w-3" />
                  <span>Start {plannedSprints[0].name}</span>
                </Button>
              )}
            </div>
          )}

          {/* Planned Sprints & Product Backlog 2-Column Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left: Product Backlog */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
                    Product Backlog
                  </h3>
                  <Badge variant="mono" size="sm">
                    {backlogIssues.length}
                  </Badge>
                </div>
                <span className="font-mono-id text-xs text-[var(--text-subtle)]">
                  {backlogIssues.reduce((sum, i) => sum + (i.estimate || 3), 0)} pts total
                </span>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]">
                {backlogIssues.length === 0 ? (
                  <p className="text-xs text-[var(--text-subtle)] py-8 text-center font-mono-id">
                    Backlog is empty. All issues are planned into sprints.
                  </p>
                ) : (
                  backlogIssues.map((issue) => (
                    <Card
                      key={issue.id}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Badge variant="mono" size="sm">
                          {project.key}-{issue.number}
                        </Badge>
                        <span className="font-medium text-[var(--text)] truncate">
                          {issue.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-id text-[11px] text-[var(--text-subtle)]">
                          {issue.estimate || 3} pts
                        </span>

                        {plannedSprints[0] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveToSprint(issue, plannedSprints[0].id)}
                            className="h-6 text-[10px] px-2 gap-1 text-[var(--accent)]"
                          >
                            <span>Add</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Right: Planned Sprints Queue */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
                  Upcoming Sprints
                </h3>
                <Badge variant="default" size="sm">
                  {plannedSprints.length} Planned
                </Badge>
              </div>

              <div className="flex flex-col gap-4">
                {plannedSprints.length === 0 ? (
                  <p className="text-xs text-[var(--text-subtle)] py-8 text-center font-mono-id">
                    No upcoming sprints planned. Click Create Sprint to schedule iteration.
                  </p>
                ) : (
                  plannedSprints.map((sprint) => (
                    <div
                      key={sprint.id}
                      className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-[var(--text)]">
                            {sprint.name}
                          </h4>
                          <span className="text-[11px] text-[var(--text-subtle)]">
                            {sprint.issues?.length || 0} issues •{" "}
                            {(sprint.issues || []).reduce((sum, i) => sum + (i.estimate || 3), 0)} pts
                          </span>
                        </div>

                        {!activeSprint && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartSprint(sprint.id)}
                            className="h-7 text-xs gap-1"
                          >
                            <Play className="h-3 w-3" />
                            <span>Start</span>
                          </Button>
                        )}
                      </div>

                      {/* Sprint issues */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        {(sprint.issues || []).map((issue) => (
                          <div
                            key={issue.id}
                            className="flex items-center justify-between py-1.5 px-2 rounded-[var(--radius-sm)] bg-[var(--bg-base)] text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Badge variant="mono" size="sm">
                                {project.key}-{issue.number}
                              </Badge>
                              <span className="truncate text-[var(--text)]">
                                {issue.title}
                              </span>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveToBacklog(issue, sprint.id)}
                              className="h-5 text-[10px] px-1.5 text-[var(--text-subtle)]"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
