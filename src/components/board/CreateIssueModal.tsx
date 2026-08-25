"use client";

import * as React from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { PriorityLevel } from "@/components/ui/priority-badge";
import type { StatusKind } from "@/components/ui/status-badge";
import { initialsOf } from "@/lib/format";
import type { ShellContext, ProjectSummaryClient } from "@/lib/types";

interface StatusOption {
  id: string;
  name: string;
  kind: StatusKind;
  isDefault: boolean;
}

interface MemberOption {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export function CreateIssueModal(props: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  context: ShellContext;
  defaultProject: ProjectSummaryClient | null;
}) {
  // Mount a fresh form per open so all state resets naturally.
  if (!props.open) return null;
  return (
    <CreateIssueModalInner
      key={props.defaultProject?.id ?? "none"}
      onClose={props.onClose}
      onCreated={props.onCreated}
      context={props.context}
      defaultProject={props.defaultProject}
    />
  );
}

function CreateIssueModalInner({
  onClose,
  onCreated,
  context,
  defaultProject,
}: {
  onClose: () => void;
  onCreated: () => void;
  context: ShellContext;
  defaultProject: ProjectSummaryClient | null;
}) {
  const wsSlug = context.currentWorkspace.slug;

  const [projectId, setProjectId] = React.useState<string>(
    defaultProject?.id ?? context.projects[0]?.id ?? ""
  );
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<PriorityLevel>("MEDIUM");
  const [estimate, setEstimate] = React.useState<number>(3);
  const [statuses, setStatuses] = React.useState<StatusOption[]>([]);
  const [statusId, setStatusId] = React.useState<string>("");
  const [members, setMembers] = React.useState<MemberOption[]>([]);
  const [assigneeId, setAssigneeId] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, []);

  // Fetch columns + members whenever the selected project changes
  React.useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    const project = context.projects.find((p) => p.id === projectId);
    if (!project) return;

    void (async () => {
      try {
        const res = await fetch(
          `/api/v1/workspaces/${wsSlug}/projects/${project.slug}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const opts: StatusOption[] = (data.project.statuses ?? []).map(
          (s: Record<string, unknown>) => ({
            id: s.id as string,
            name: s.name as string,
            kind: s.kind as StatusKind,
            isDefault: Boolean(s.isDefault),
          })
        );
        setStatuses(opts);
        setStatusId(
          opts.find((s) => s.isDefault)?.id ?? opts.find((s) => s.kind === "TODO")?.id ?? opts[0]?.id ?? ""
        );
        setMembers(
          (data.project.members ?? []).map((m: Record<string, unknown>) => {
            const user = m.user as MemberOption;
            return { id: user.id, name: user.name, avatarUrl: user.avatarUrl };
          })
        );
      } catch {
        /* non-fatal */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, context.projects, wsSlug]);

  const submit = async () => {
    if (!title.trim() || !projectId) return;
    setSubmitting(true);
    setError(null);

    const project = context.projects.find((p) => p.id === projectId)!;
    try {
      const res = await fetch(
        `/api/v1/workspaces/${wsSlug}/projects/${project.slug}/issues`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            estimate,
            statusId: statusId || undefined,
            assigneeId: assigneeId || undefined,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex select-none items-center justify-center bg-black/50 p-4 animate-overlay-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
        }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)] px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Badge variant="mono" size="sm">
              {context.projects.find((p) => p.id === projectId)?.key ?? "NEW"}
            </Badge>
            Create Issue
          </span>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="flex flex-col gap-3.5 p-4"
        >
          {error && (
            <p className="rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-2.5 py-1.5 text-xs text-[var(--danger-fg)]">
              {error}
            </p>
          )}

          {/* Project selector */}
          {context.projects.length > 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2 text-xs text-[var(--text)] focus-ring"
              >
                {context.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.key} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
              Title <span className="text-[var(--danger)]">*</span>
            </label>
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short, action-oriented summary…"
              maxLength={200}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context, acceptance criteria, links… (markdown supported)"
              className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] p-2.5 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)] focus-ring"
            />
          </div>

          <div className="grid grid-cols-4 gap-2.5 pt-0.5">
            <Select label="Column" value={statusId} onChange={setStatusId}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              {statuses.length === 0 && <option value="">Default</option>}
            </Select>

            <Select
              label="Priority"
              value={priority}
              onChange={(v) => setPriority(v as PriorityLevel)}
            >
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="NONE">None</option>
            </Select>

            <Select
              label="Estimate"
              value={String(estimate)}
              onChange={(v) => setEstimate(Number(v))}
              mono
            >
              {[1, 2, 3, 5, 8].map((n) => (
                <option key={n} value={n}>
                  {n} pts
                </option>
              ))}
            </Select>

            <Select
              label="Assignee"
              value={assigneeId}
              onChange={setAssigneeId}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.id.slice(0, 8)}
                </option>
              ))}
            </Select>
          </div>

          {/* Assignee preview */}
          {assigneeId && (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <Avatar
                fallback={initialsOf(members.find((m) => m.id === assigneeId)?.name)}
                size="xs"
              />
              Will be assigned to {members.find((m) => m.id === assigneeId)?.name}
            </div>
          )}

          <div className="-mx-4 -mb-4 flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg-base)] px-4 py-3">
            <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
              ⌘↵ to create
            </span>
            <span className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!title.trim() || submitting}
                className="gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Create Issue
                  </>
                )}
              </Button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-1.5 text-xs text-[var(--text)] outline-none focus-ring ${mono ? "font-mono-id" : ""}`}
      >
        {children}
      </select>
    </label>
  );
}
