"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GitBranch,
  Copy,
  Check,
  Loader2,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, type PriorityLevel } from "@/components/ui/priority-badge";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";
import { formatDateTime, relativeTime, initialsOf } from "@/lib/format";

interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
}

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
  createdBy: { id: string; name: string | null };
  project: {
    key: string;
    name: string;
    slug: string;
    statuses: { id: string; name: string; kind: StatusKind }[];
  };
  labels: { label: { id: string; name: string; color: string } }[];
  comments: CommentItem[];
}

export default function IssueDetailClient({
  initialIssue,
  workspaceSlug,
}: {
  initialIssue: FullIssue;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [issue, setIssue] = React.useState(initialIssue);
  const [saving, setSaving] = React.useState(false);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(issue.title);
  const [descDraft, setDescDraft] = React.useState<string | null>(null);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [copiedBranch, setCopiedBranch] = React.useState(false);

  const project = issue.project;
  const branch = `feat/${project.key.toLowerCase()}-${issue.number}`;
  const apiBase = `/api/v1/workspaces/${workspaceSlug}/projects/${project.slug}/issues/${issue.number}`;

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(apiBase, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const raw = data.issue;
      setIssue((prev) => ({
        ...prev,
        title: raw.title ?? prev.title,
        description:
          raw.description !== undefined ? raw.description : prev.description,
        priority: raw.priority ?? prev.priority,
        estimate: raw.estimate !== undefined ? raw.estimate : prev.estimate,
        assignee: raw.assignee !== undefined ? raw.assignee : prev.assignee,
        updatedAt: new Date().toISOString(),
      }));
    } finally {
      setSaving(false);
    }
  };

  const postComment = async () => {
    if (!commentDraft.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`${apiBase}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentDraft.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIssue((prev) => ({ ...prev, comments: [...prev.comments, data.comment] }));
      setCommentDraft("");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      {/* Nav */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <Link
          href={`/${workspaceSlug}/projects/${project.slug}`}
          className="flex items-center gap-2 text-xs text-[var(--text-subtle)] transition-colors hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {project.name}
        </Link>
        <Badge variant="mono" size="md">
          {project.key}-{issue.number}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-8 pt-6 md:grid-cols-3">
        {/* Main */}
        <div className="flex flex-col gap-6 md:col-span-2">
          {editingTitle ? (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--accent)]/50 bg-[var(--bg-base)] px-3 py-2 text-lg font-bold outline-none"
              />
              <span className="flex gap-2">
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => {
                    void patch({ title: titleDraft.trim() });
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
            <div className="group flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold leading-snug tracking-tight">
                {issue.title}
              </h1>
              <button
                onClick={() => {
                  setTitleDraft(issue.title);
                  setEditingTitle(true);
                }}
                className="shrink-0 rounded p-1 text-[var(--text-subtle)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text)]"
                title="Edit title"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="-mt-3 font-mono-id text-[11px] text-[var(--text-subtle)]">
            opened {formatDateTime(issue.createdAt)} by{" "}
            {issue.createdBy.name ?? "member"} · updated {relativeTime(issue.updatedAt)}
          </p>

          {/* Description */}
          {descDraft === null ? (
            <div className="group relative rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-4">
              <p className="whitespace-pre-wrap text-xs leading-relaxed">
                {issue.description?.trim() || "No description provided."}
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
                rows={8}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--accent)]/50 bg-[var(--bg-base)] p-3 text-xs outline-none"
              />
              <span className="flex gap-2">
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => {
                    void patch({ description: descDraft });
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

          {/* Branch */}
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2">
              <GitBranch className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              <code className="truncate font-mono-id text-xs">{branch}</code>
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                void navigator.clipboard.writeText(`git checkout -b ${branch}`);
                setCopiedBranch(true);
                setTimeout(() => setCopiedBranch(false), 1600);
              }}
              className="gap-1"
            >
              {copiedBranch ? (
                <>
                  <Check className="h-3 w-3 text-[var(--success)]" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> git checkout
                </>
              )}
            </Button>
          </div>

          {/* Comments */}
          <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Discussion ({issue.comments.length})
            </h3>

            {issue.comments.length === 0 ? (
              <p className="font-mono-id text-xs text-[var(--text-subtle)]">
                No comments yet — start the thread below.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {issue.comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-3.5"
                  >
                    <span className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Avatar src={c.user.avatarUrl} fallback={initialsOf(c.user.name)} size="xs" />
                        <b className="text-xs">{c.user.name ?? "Member"}</b>
                      </span>
                      <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
                        {relativeTime(c.createdAt)}
                      </span>
                    </span>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void postComment();
              }}
              className="flex flex-col gap-2 pt-1"
            >
              <textarea
                rows={3}
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Write a comment… (markdown supported)"
                className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-3 text-xs outline-none focus-ring"
              />
              <span className="flex justify-end">
                <Button variant="primary" size="sm" disabled={!commentDraft.trim() || posting} className="gap-1.5">
                  {posting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Post comment
                </Button>
              </span>
            </form>
          </section>
        </div>

        {/* Properties sidebar */}
        <aside className="flex h-fit flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
            Properties {saving && <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-[var(--accent)]" />}
          </h3>

          <Field label="Status">
            <StatusBadge status={issue.status.kind} />
            <select
              value={issue.status.id}
              onChange={(e) => void patch({ statusId: e.target.value })}
              className="mt-1 w-full rounded bg-transparent text-xs text-[var(--text-muted)] outline-none focus-ring"
            >
              {issue.project.statuses.length > 0 ? (
                issue.project.statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              ) : (
                <option value={issue.status.id}>{issue.status.name}</option>
              )}
            </select>
          </Field>

          <Field label="Priority">
            <PriorityBadge priority={issue.priority} showLabel />
            <select
              value={issue.priority}
              onChange={(e) => void patch({ priority: e.target.value })}
              className="mt-1 w-full rounded bg-transparent text-xs text-[var(--text-muted)] outline-none focus-ring"
            >
              {["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"].map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Assignee">
            <span className="flex items-center gap-1.5">
              {issue.assignee ? (
                <>
                  <Avatar src={issue.assignee.avatarUrl} fallback={initialsOf(issue.assignee.name)} size="xs" />
                  <span className="truncate text-xs">{issue.assignee.name ?? "Member"}</span>
                </>
              ) : (
                <span className="text-xs italic text-[var(--text-subtle)]">Unassigned</span>
              )}
            </span>
          </Field>

          <Field label="Estimate">
            <select
              value={String(issue.estimate ?? "")}
              onChange={(e) =>
                void patch({ estimate: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full rounded bg-transparent font-mono-id text-xs text-[var(--text-muted)] outline-none focus-ring"
            >
              <option value="">None</option>
              {[1, 2, 3, 5, 8].map((n) => (
                <option key={n} value={n}>
                  {n} pts
                </option>
              ))}
            </select>
          </Field>

          {issue.labels.length > 0 && (
            <Field label="Labels">
              <span className="flex flex-wrap gap-1.5 pt-0.5">
                {issue.labels.map(({ label }) => (
                  <Badge key={label.id} variant="purple" size="xs">
                    {label.name}
                  </Badge>
                ))}
              </span>
            </Field>
          )}
        </aside>
      </div>

      <button
        onClick={() => router.back()}
        className="mx-auto mt-10 block font-mono-id text-[10px] text-[var(--text-subtle)] hover:text-[var(--text)]"
      >
        go back
      </button>
    </div>
  );
}

function Field({
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
      {children}
    </div>
  );
}
