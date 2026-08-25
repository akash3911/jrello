"use client";

import * as React from "react";
import Link from "next/link";
import {
  Play,
  CheckCircle2,
  Plus,
  ArrowRight,
  BarChart3,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import type { PriorityLevel } from "@/components/ui/priority-badge";
import type { StatusKind } from "@/components/ui/status-badge";

export interface SprintIssueItem {
  id: string;
  key: string;
  number: number;
  title: string;
  estimate: number | null;
  priority: PriorityLevel;
  statusKind: StatusKind;
}

export interface SprintItem {
  id: string;
  name: string;
  goal: string | null;
  state: "PLANNED" | "ACTIVE" | "COMPLETED";
  startDate: string;
  endDate: string;
  issues: SprintIssueItem[];
}

export default function SprintPlanningClient({
  projectKey,
  projectSlug,
  workspaceSlug,
  initialSprints,
  backlogIssues: initialBacklog,
}: {
  projectKey: string;
  projectSlug: string;
  workspaceSlug: string;
  initialSprints: SprintItem[];
  backlogIssues: SprintIssueItem[];
}) {
  const [sprints, setSprints] = React.useState(initialSprints);
  const [backlog, setBacklog] = React.useState(initialBacklog);
  const [busySprintId, setBusySprintId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // New sprint form
  const [name, setName] = React.useState("");
  const [goal, setGoal] = React.useState("");

  const active = sprints.find((s) => s.state === "ACTIVE");
  const planned = sprints.filter((s) => s.state === "PLANNED");
  const completed = sprints.filter((s) => s.state === "COMPLETED");

  const api = React.useCallback(
    async (
      path: string,
      init?: RequestInit
    ): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> => {
      try {
        const res = await fetch(
          `/api/v1/workspaces/${workspaceSlug}/projects/${projectSlug}/sprints${path}`,
          init
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.error ?? `Failed (${res.status})` };
        return { ok: true, data };
      } catch {
        return { ok: false, error: "Network error" };
      }
    },
    [workspaceSlug, projectSlug]
  );

  const createSprint = async () => {
    setError(null);
    const sprintName = name.trim() || `Sprint ${sprints.length + 1}`;
    setBusySprintId("__new__");
    const start = new Date();
    const end = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    const result = await api("", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: sprintName,
        goal: goal.trim() || undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      }),
    });
    setBusySprintId(null);

    if (!result.ok) {
      setError(result.error ?? "Could not create sprint");
      return;
    }
    const raw = result.data!.sprint as Record<string, unknown>;
    setSprints((prev) => [
      ...prev,
      {
        id: raw.id as string,
        name: raw.name as string,
        goal: (raw.goal as string | null) ?? null,
        state: "PLANNED",
        startDate: (raw.startDate as string).toString(),
        endDate: (raw.endDate as string).toString(),
        issues: [],
      },
    ]);
    setName("");
    setGoal("");
    setCreating(false);
  };

  const startSprint = async (id: string) => {
    setError(null);
    setBusySprintId(id);
    const result = await api(`/${id}/start`, { method: "POST" });
    setBusySprintId(null);
    if (!result.ok) {
      setError(result.error ?? "Could not start sprint");
      return;
    }
    setSprints((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              state: "ACTIVE",
              startDate:
                (result.data!.sprint as Record<string, unknown>).startDate as string,
            }
          : s.state === "ACTIVE"
            ? { ...s, state: "PLANNED" }
            : s
      )
    );
  };

  const completeSprint = async (id: string) => {
    setError(null);
    setBusySprintId(id);
    const result = await api(`/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incompleteAction: "backlog" }),
    });
    setBusySprintId(null);
    if (!result.ok) {
      setError(result.error ?? "Could not complete sprint");
      return;
    }
    // Move incomplete issues back to backlog locally
    const sprint = sprints.find((s) => s.id === id);
    const carried = (sprint?.issues ?? []).filter(
      (i) => i.statusKind !== "DONE" && i.statusKind !== "CANCELED"
    );
    setSprints((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, state: "COMPLETED", issues: s.issues.filter((i) => !carried.some((c) => c.id === i.id)) }
          : s
      )
    );
    setBacklog((prev) => [...carried, ...prev]);
  };

  const moveToSprint = async (issue: SprintIssueItem, sprintId: string | null) => {
    // Optimistic
    if (sprintId) {
      setBacklog((prev) => prev.filter((i) => i.id !== issue.id));
      setSprints((prev) =>
        prev.map((s) => (s.id === sprintId ? { ...s, issues: [...s.issues, issue] } : s))
      );
    } else {
      setSprints((prev) =>
        prev.map((s) => ({
          ...s,
          issues: s.issues.filter((i) => i.id !== issue.id),
        }))
      );
      setBacklog((prev) => [...prev, issue]);
    }

    const result = await api("/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId: issue.id, sprintId }),
    });
    if (!result.ok) {
      // Roll back on failure
      if (sprintId) {
        setBacklog((prev) => [...prev, issue]);
        setSprints((prev) =>
          prev.map((s) =>
            s.id === sprintId ? { ...s, issues: s.issues.filter((i) => i.id !== issue.id) } : s
          )
        );
      } else {
        setBacklog((prev) => prev.filter((i) => i.id !== issue.id));
      }
      setError(result.error ?? "Could not move issue");
    }
  };

  const points = (issues: SprintIssueItem[]) =>
    issues.reduce((sum, i) => sum + (i.estimate ?? 3), 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            Sprint Planning
            <Badge variant="mono">{projectKey}</Badge>
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Allocate work into time-boxed iterations and track delivery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${workspaceSlug}/projects/${projectSlug}/sprints/reports`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5 text-[var(--accent)]" /> Velocity Report
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setCreating(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Create Sprint
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger-fg)]">
          {error}
        </p>
      )}

      {/* New sprint form */}
      {creating && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createSprint();
          }}
          className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--accent)]/50 bg-[var(--bg-raised)] p-4 shadow-[var(--shadow-sm)] animate-modal-in"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Name
              </span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Sprint ${sprints.length + 1}`}
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2.5 text-xs outline-none focus-ring"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Goal (optional)
              </span>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What should this sprint achieve?"
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2.5 text-xs outline-none focus-ring"
              />
            </label>
          </div>
          <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
            Default duration: 2 weeks, starting today.
          </span>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={busySprintId === "__new__"}>
              Save Sprint
            </Button>
          </div>
        </form>
      )}

      {/* Active sprint */}
      {active ? (
        <section className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--accent)]/50 bg-[var(--bg-raised)] p-5 shadow-[var(--shadow-xs)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="accent">ACTIVE</Badge>
              <h2 className="text-sm font-semibold">{active.name}</h2>
              <span className="font-mono-id text-[11px] text-[var(--text-subtle)]">
                {active.issues.length} issues · {points(active.issues)} pts · ends{" "}
                {formatDate(active.endDate)}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void completeSprint(active.id)}
              disabled={busySprintId === active.id}
              className="gap-1.5 text-xs"
            >
              {busySprintId === active.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
              )}
              Complete Sprint
            </Button>
          </div>
          {active.goal && (
            <p className="rounded-[var(--radius-sm)] bg-[var(--accent-soft)]/60 px-3 py-2 text-xs italic text-[var(--text-muted)]">
              Goal: {active.goal}
            </p>
          )}
          <IssueRows
            projectKey={projectKey}
            issues={active.issues}
            emptyText="No issues allocated yet — add some from the backlog below."
            onRemove={(i) => void moveToSprint(i, null)}
          />
        </section>
      ) : (
        <section className="flex items-center justify-between rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-raised)]/50 p-5">
          <div>
            <h2 className="text-xs font-semibold">No active sprint</h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-subtle)]">
              Start a planned sprint to begin a time-boxed iteration.
            </p>
          </div>
        </section>
      )}

      {/* Backlog + planned */}
      <div className="grid grid-cols-1 gap-6 pt-1 md:grid-cols-2">
        {/* Backlog */}
        <section className="flex min-w-0 flex-col gap-2.5">
          <header className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              Product Backlog
              <Badge variant="mono" size="sm">
                {backlog.length}
              </Badge>
            </span>
            <span className="font-mono-id text-[11px] text-[var(--text-subtle)]">
              {points(backlog)} pts
            </span>
          </header>
          {backlog.length === 0 ? (
            <EmptyBox text="Backlog is empty." />
          ) : (
            <ul className="flex max-h-[26rem] flex-col gap-2 overflow-y-auto pr-1">
              {backlog.map((issue) => (
                <li
                  key={issue.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-xs shadow-[var(--shadow-xs)]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Badge variant="mono" size="xs">
                      {issue.key}
                    </Badge>
                    <span className="truncate font-medium">{issue.title}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={issue.priority} />
                    <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
                      {issue.estimate ?? 3}
                    </span>
                    {planned[0] && !active && (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="gap-0.5 text-[var(--accent)]"
                        title={`Add to ${planned[0].name}`}
                        onClick={() => void moveToSprint(issue, planned[0].id)}
                      >
                        Add <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Planned + completed */}
        <section className="flex min-w-0 flex-col gap-2.5">
          <header className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              Upcoming & Past
              <Badge variant="mono" size="sm">
                {planned.length + completed.length}
              </Badge>
            </span>
          </header>

          {planned.length === 0 && completed.length === 0 && (
            <EmptyBox text="Nothing planned yet. Create a sprint to get going." />
          )}

          {planned.map((sprint) => (
            <article
              key={sprint.id}
              className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-4 shadow-[var(--shadow-xs)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold">{sprint.name}</h4>
                  <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
                    {sprint.issues.length} issues · {points(sprint.issues)} pts · starts{" "}
                    {formatDate(sprint.startDate)}
                  </span>
                </div>
                {!active && (
                  <Button size="xs" variant="primary" className="gap-1" onClick={() => void startSprint(sprint.id)}>
                    <Play className="h-3 w-3" /> Start
                  </Button>
                )}
              </div>
              {sprint.goal && (
                <p className="text-[11px] italic text-[var(--text-subtle)]">Goal: {sprint.goal}</p>
              )}
              {sprint.issues.length > 0 && (
                <IssueRows
                  projectKey={projectKey}
                  issues={sprint.issues}
                  compact
                  emptyText=""
                  onRemove={(i) => void moveToSprint(i, null)}
                />
              )}
            </article>
          ))}

          {completed.slice(0, 3).map((sprint) => (
            <article
              key={sprint.id}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)]/60 p-3.5 opacity-80"
            >
              <div>
                <h4 className="text-xs font-semibold">{sprint.name}</h4>
                <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
                  ended {formatDate(sprint.endDate)}
                </span>
              </div>
              <Badge variant="success" size="sm">
                COMPLETED
              </Badge>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

function IssueRows({
  projectKey,
  issues,
  emptyText,
  compact = false,
  onRemove,
}: {
  projectKey: string;
  issues: SprintIssueItem[];
  emptyText: string;
  compact?: boolean;
  onRemove: (issue: SprintIssueItem) => void;
}) {
  void projectKey;
  if (issues.length === 0 && emptyText) {
    return <p className="py-3 font-mono-id text-[11px] text-[var(--text-subtle)]">{emptyText}</p>;
  }

  return (
    <ul className={compact ? "flex flex-col gap-1" : "flex flex-col gap-1.5"}>
      {issues.map((issue) => (
        <li
          key={issue.id}
          className={`group flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-base)] ${compact ? "px-2 py-1" : "px-2.5 py-1.5"} text-xs`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <StatusBadge status={issue.statusKind} showLabel={!compact} />
            <span className="truncate font-medium text-[var(--text)]">{issue.title}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
              {issue.estimate ?? 3} pts
            </span>
            <button
              onClick={() => onRemove(issue)}
              title="Move back to backlog"
              className="hidden rounded p-0.5 text-[var(--text-subtle)] hover:text-[var(--danger-fg)] group-hover:block"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] py-10 text-center">
      <p className="font-mono-id text-[11px] text-[var(--text-subtle)]">{text}</p>
    </div>
  );
}
