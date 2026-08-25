"use client";

import * as React from "react";
import {
  X,
  GitBranch,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, type PriorityLevel } from "@/components/ui/priority-badge";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";
import { relativeTime, initialsOf, formatDateTime } from "@/lib/format";
import type { ProjectMemberClient } from "@/lib/types";

interface FullIssue {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: { id: string; name: string; kind: StatusKind };
  priority: PriorityLevel;
  estimate: number | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string | null; avatarUrl: string | null } | null;
  project: {
    key: string;
    slug: string;
    statuses: { id: string; name: string; kind: StatusKind }[];
  };
  labels: { label: { id: string; name: string; color: string } }[];
  comments: {
    id: string;
    body: string;
    createdAt: string;
    user: { id: string; name: string | null; avatarUrl: string | null };
  }[];
}

export function IssueDetailPanel(props: {
  /** e.g. CORE-12 */
  issueKey: string | null;
  workspaceSlug: string;
  members: ProjectMemberClient[];
  onClose: () => void;
  onChanged: (patch: {
    statusKind?: StatusKind;
    priority?: PriorityLevel;
    estimate?: number | null;
    assignee?: { id: string; name: string | null; avatarUrl: string | null } | null;
    title?: string;
    description?: string | null;
    commentsCountDelta?: number;
  }) => void;
  onDeleted: () => void;
}) {
  // Fresh panel state per opened issue.
  if (!props.issueKey) return null;
  return (
    <IssueDetailPanelInner
      key={props.issueKey}
      issueKey={props.issueKey}
      workspaceSlug={props.workspaceSlug}
      members={props.members}
      onClose={props.onClose}
      onChanged={props.onChanged}
      onDeleted={props.onDeleted}
    />
  );
}

function IssueDetailPanelInner({
  issueKey,
  workspaceSlug,
  members,
  onClose,
  onChanged,
  onDeleted,
}: {
  issueKey: string;
  workspaceSlug: string;
  members: ProjectMemberClient[];
  onClose: () => void;
  onChanged: (patch: {
    statusKind?: StatusKind;
    priority?: PriorityLevel;
    estimate?: number | null;
    assignee?: { id: string; name: string | null; avatarUrl: string | null } | null;
    title?: string;
    description?: string | null;
    commentsCountDelta?: number;
  }) => void;
  onDeleted: () => void;
}) {
  const [issue, setIssue] = React.useState<FullIssue | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editingTitle, setEditingTitle] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState("");
  const [descDraft, setDescDraft] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [copiedBranch, setCopiedBranch] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const [projectSlug, setProjectSlug] = React.useState<string | null>(null);

  // Load detail for this issue (fresh mount per key)
  React.useEffect(() => {
    let cancelled = false;

    const [projKey, numStr] = issueKey.split("-");
    void (async () => {
      try {
        const res = await fetch(
          `/api/v1/workspaces/${workspaceSlug}/projects/${projKey}/issues/${numStr}`
        );
        if (!res.ok) throw new Error("Failed to load issue");
        const data = await res.json();
        if (cancelled) return;
        const raw = data.issue;

        setIssue({
          ...raw,
          project: {
            key: raw.project.key,
            slug: raw.project.slug,
            statuses: (raw.project.statuses ?? []).map(
              (s: { id: string; name: string; kind: StatusKind }) => s
            ),
          },
        });
        setProjectSlug(raw.project.slug);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load issue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [issueKey, workspaceSlug]);

  // Escape closes
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const el = document.activeElement as HTMLElement | null;
        const typing =
          el && ["INPUT", "TEXTAREA"].includes(el.tagName) && el !== document.body;
        if (!typing) onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const patchIssue = async (
    patch: Record<string, unknown>,
    localPatch: Parameters<typeof onChanged>[0]
  ) => {
    if (!issue || !projectSlug) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${projectSlug}/issues/${issue.number}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      const raw = data.issue;
      setIssue((prev) =>
        prev
          ? {
              ...prev,
              ...(raw.title !== undefined ? { title: raw.title } : {}),
              ...(raw.description !== undefined ? { description: raw.description } : {}),
              ...(raw.priority !== undefined ? { priority: raw.priority } : {}),
              ...(raw.estimate !== undefined ? { estimate: raw.estimate } : {}),
              ...(raw.assignee !== undefined ? { assignee: raw.assignee } : {}),
            }
          : prev
      );
      onChanged(localPatch);
    } catch {
      setError("Failed to save change");
    } finally {
      setSaving(false);
    }
  };

  const postComment = async () => {
    if (!issue || !projectSlug || !commentDraft.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${projectSlug}/issues/${issue.number}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: commentDraft.trim() }),
        }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIssue((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data.comment] } : prev
      );
      setCommentDraft("");
      onChanged({ commentsCountDelta: 1 });
    } catch {
      setError("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const deleteIssue = async () => {
    if (!issue || !projectSlug) return;
    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${projectSlug}/issues/${issue.number}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      onDeleted();
    } catch {
      setError("Failed to delete issue");
    }
  };

  const copyBranch = () => {
    if (!issue) return;
    const branch = `feat/${issue.project.key.toLowerCase()}-${issue.number}`;
    void navigator.clipboard.writeText(branch).catch(() => {});
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 1600);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 animate-overlay-in lg:hidden" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-[var(--border)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] animate-panel-in">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          {issue ? (
            <span className="flex items-center gap-2">
              <Badge variant="mono" size="md">
                {issue.project.key}-{issue.number}
              </Badge>
              <span className="font-mono-id text-[11px] text-[var(--text-subtle)]">
                opened {relativeTime(issue.createdAt)}
              </span>
            </span>
          ) : (
            <span className="font-mono-id text-xs text-[var(--text-subtle)]">{issueKey}</span>
          )}
          <Button variant="ghost" size="icon-xs" onClick={onClose} title="Close (Esc)">
            <X className="h-4 w-4" />
          </Button>
        </header>

        {/* Body */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-xs text-[var(--text-muted)]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--accent)]" /> Loading…
          </div>
        ) : error && !issue ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-xs text-[var(--danger-fg)]">{error}</p>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : issue ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
            {/* Title */}
            {editingTitle ? (
              <div className="flex flex-col gap-2">
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && titleDraft.trim()) {
                      void patchIssue({ title: titleDraft.trim() }, { title: titleDraft.trim() });
                      setEditingTitle(false);
                    }
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--accent)]/50 bg-[var(--bg-base)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text)] outline-none"
                />
                <span className="flex gap-2">
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => {
                      void patchIssue({ title: titleDraft.trim() }, { title: titleDraft.trim() });
                      setEditingTitle(false);
                    }}
                    disabled={!titleDraft.trim()}
                  >
                    Save
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setEditingTitle(false)}>
                    Cancel
                  </Button>
                </span>
              </div>
            ) : (
              <hgroup className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold leading-snug text-[var(--text)]">
                  {issue.title}
                </h2>
                <button
                  onClick={() => {
                    setTitleDraft(issue.title);
                    setEditingTitle(true);
                  }}
                  title="Edit title"
                  className="shrink-0 rounded p-1 text-[var(--text-subtle)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </hgroup>
            )}

            {/* Properties grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] p-4">
              <Property label="Status">
                <StatusBadge status={issue.status.kind} size="md" />
                <select
                  value={
                    issue.project.statuses.some((s) => s.id === issue.status.id)
                      ? issue.status.id
                      : issue.status.id /* always a real id from server */
                  }
                  onChange={(e) => {
                    const target = e.target.selectedOptions[0];
                    void patchIssue(
                      { statusId: e.target.value },
                      { statusKind: target.dataset.kind as StatusKind }
                    );
                  }}
                  disabled={saving}
                  className="w-full rounded border-none bg-transparent text-[11px] text-[var(--text-muted)] outline-none focus-ring"
                >
                  {issue.project.statuses.map((s) => (
                    <option key={s.id} value={s.id} data-kind={s.kind}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Property>

              <Property label="Priority">
                <PriorityBadge priority={issue.priority} size="md" showLabel />
                <select
                  value={issue.priority}
                  onChange={(e) =>
                    void patchIssue({ priority: e.target.value }, { priority: e.target.value as PriorityLevel })
                  }
                  disabled={saving}
                  className="rounded border-none bg-transparent text-[11px] text-[var(--text-muted)] outline-none focus-ring"
                >
                  {["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"].map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </Property>

              <Property label="Assignee">
                <span className="flex items-center gap-1.5">
                  {issue.assignee ? (
                    <>
                      <Avatar src={issue.assignee.avatarUrl} fallback={initialsOf(issue.assignee.name)} size="xs" />
                      <span className="truncate text-xs font-medium text-[var(--text)]">
                        {issue.assignee.name ?? "Member"}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-[var(--text-subtle)]">Unassigned</span>
                  )}
                </span>
                <select
                  value={issue.assignee?.id ?? ""}
                  onChange={(e) => {
                    const m = members.find((mm) => mm.user.id === e.target.value);
                    void patchIssue(
                      { assigneeId: e.target.value || null },
                      {
                        assignee: m
                          ? { id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl }
                          : null,
                      }
                    );
                  }}
                  disabled={saving}
                  className="w-full truncate rounded border-none bg-transparent text-[11px] text-[var(--text-muted)] outline-none focus-ring"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name ?? m.user.email}
                    </option>
                  ))}
                </select>
              </Property>

              <Property label="Estimate">
                <span className="font-mono-id text-xs font-medium text-[var(--text-muted)]">
                  {issue.estimate != null ? `${issue.estimate} pts` : "—"}
                </span>
                <select
                  value={String(issue.estimate ?? "")}
                  onChange={(e) =>
                    void patchIssue(
                      { estimate: e.target.value ? Number(e.target.value) : null },
                      { estimate: e.target.value ? Number(e.target.value) : null }
                    )
                  }
                  disabled={saving}
                  className="rounded border-none bg-transparent font-mono-id text-[11px] text-[var(--text-muted)] outline-none focus-ring"
                >
                  <option value="">None</option>
                  {[1, 2, 3, 5, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} pts
                    </option>
                  ))}
                </select>
              </Property>
            </div>

            {/* Development */}
            <section className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                <code className="truncate font-mono-id text-[11px] text-[var(--text)]">
                  feat/{issue.project.key.toLowerCase()}-{issue.number}
                </code>
              </span>
              <Button variant="ghost" size="xs" onClick={copyBranch} className="gap-1 shrink-0">
                {copiedBranch ? (
                  <>
                    <Check className="h-3 w-3 text-[var(--success)]" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy branch
                  </>
                )}
              </Button>
            </section>

            {/* Description */}
            <section className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Description
              </span>
              {descDraft === null ? (
                <div className="group relative">
                  <p className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] p-3 text-xs leading-relaxed text-[var(--text)]">
                    {issue.description?.trim() || "No description yet."}
                  </p>
                  <button
                    onClick={() => setDescDraft(issue.description ?? "")}
                    className="absolute right-2 top-2 hidden rounded p-1 text-[var(--text-subtle)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text)] group-hover:block"
                    title="Edit description"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    autoFocus
                    rows={6}
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    placeholder="Add context, acceptance criteria…"
                    className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--accent)]/50 bg-[var(--bg-base)] p-2.5 text-xs text-[var(--text)] outline-none"
                  />
                  <span className="flex gap-2">
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => {
                        void patchIssue({ description: descDraft }, { description: descDraft });
                        setDescDraft(null);
                      }}
                    >
                      Save
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setDescDraft(null)}>
                      Cancel
                    </Button>
                  </span>
                </div>
              )}
            </section>

            {/* Labels */}
            {issue.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {issue.labels.map(({ label }) => (
                  <Badge key={label.id} variant="purple" size="sm">
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Comments */}
            <section className="flex flex-col gap-3">
              <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                <MessageSquare className="h-3.5 w-3.5" />
                Discussion ({issue.comments.length})
              </span>

              {issue.comments.length > 0 && (
                <ul className="flex flex-col gap-2.5">
                  {issue.comments.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] p-3"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <Avatar src={c.user.avatarUrl} fallback={initialsOf(c.user.name)} size="xs" />
                          <b className="text-xs font-semibold text-[var(--text)]">
                            {c.user.name ?? "Member"}
                          </b>
                        </span>
                        <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
                          {relativeTime(c.createdAt)}
                        </span>
                      </span>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text)]">
                        {c.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <textarea
                  rows={3}
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Leave a comment…"
                  className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] p-2.5 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)] focus-ring"
                />
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="xs"
                    disabled={!commentDraft.trim() || posting}
                    onClick={() => void postComment()}
                    className="gap-1.5"
                  >
                    {posting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Comment
                  </Button>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <section className="mt-auto border-t border-[var(--danger)]/25 pt-4 pb-1">
              {confirmDelete ? (
                <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)]/60 px-3 py-2.5">
                  <span className="text-xs text-[var(--danger-fg)]">Delete this issue?</span>
                  <span className="flex gap-1.5">
                    <Button size="xs" variant="ghost" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                    <Button size="xs" variant="danger" onClick={() => void deleteIssue()} className="gap-1">
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-[11px] text-[var(--text-subtle)] transition-colors hover:text-[var(--danger-fg)]"
                >
                  <Trash2 className="h-3 w-3" /> Delete issue…
                </button>
              )}
              <p className="mt-1.5 font-mono-id text-[9px] text-[var(--text-subtle)] opacity-60">
                updated {formatDateTime(issue.updatedAt)}
              </p>
            </section>
          </div>
        ) : null}
      </aside>
    </>
  );
}

function Property({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
        {label}
      </span>
      <div className="flex flex-col gap-0.5 pl-1">{children}</div>
    </div>
  );
}
