"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { initialsOf } from "@/lib/format";
import type { ProjectDetailClient } from "@/lib/types";

export default function ProjectSettingsClient({
  project,
  workspaceSlug,
}: {
  project: ProjectDetailClient;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description ?? "");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/github`
      : "/api/webhooks/github";

  const save = async () => {
    if (name.trim().length < 2) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${project.slug}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description }),
        }
      );
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      router.refresh();
    } catch {
      /* keep form state; surface nothing fancy */
    } finally {
      setSaving(false);
    }
  };

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const deleteProject = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${project.slug}`,
        { method: "DELETE" }
      );
      if (res.ok) router.push(`/${workspaceSlug}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          Project Settings
          <Badge variant="mono">{project.key}</Badge>
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Configure {project.name} and manage its team.
        </p>
      </div>

      {/* General */}
      <section className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-5 shadow-[var(--shadow-xs)]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
          General
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
            Project name
          </span>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
            Issue key (immutable)
          </span>
          <Input
            value={project.key}
            disabled
            className="font-mono-id opacity-70"
          />
          <span className="text-[10px] text-[var(--text-subtle)]">
            Keys are permanent so issue references like {project.key}-101 never break.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
            Description
          </span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] p-2.5 text-xs outline-none placeholder:text-[var(--text-subtle)] focus-ring"
          />
        </label>

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
          <span className={`text-xs ${saved ? "text-[var(--success)]" : "text-transparent"}`}>
            Saved ✓
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void save()}
            disabled={saving || name.trim().length < 2}
            className="gap-1.5"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </Button>
        </div>
      </section>

      {/* Workflow */}
      <section className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-5 shadow-[var(--shadow-xs)]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
          Board columns
        </h2>
        <ul className="flex flex-wrap gap-2">
          {project.statuses.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
            >
              <span className="font-medium text-[var(--text)]">{s.name}</span>
              {s.isDefault && (
                <Badge variant="accent" size="xs">
                  default
                </Badge>
              )}
              <span className="font-mono-id text-[9px] text-[var(--text-subtle)]">
                pos {s.position}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Members */}
      <section className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-5 shadow-[var(--shadow-xs)]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
          Team ({project.members.length})
        </h2>
        <ul className="divide-y divide-[var(--border)]/60">
          {project.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-xs">
              <span className="flex items-center gap-2.5">
                <Avatar src={m.user.avatarUrl} fallback={initialsOf(m.user.name)} size="sm" />
                <span>
                  <b className="block font-semibold text-[var(--text)]">
                    {m.user.name ?? m.user.email}
                  </b>
                  <span className="block text-[10px] text-[var(--text-subtle)]">
                    {m.user.email}
                  </span>
                </span>
              </span>
              <Badge variant={m.role === "ADMIN" ? "accent" : "default"} size="sm">
                {m.role}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      {/* GitHub */}
      <section className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-5 shadow-[var(--shadow-xs)]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
          GitHub integration
        </h2>
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          Point a GitHub webhook at the endpoint below and commits or PRs mentioning{" "}
          <code className="rounded bg-[var(--bg-inset)] px-1 font-mono-id text-[11px] font-bold text-[var(--accent)]">
            {project.key}-*
          </code>{" "}
          will be linked to issues automatically.
        </p>
        <div className="flex items-center gap-2">
          <Input value={webhookUrl} readOnly className="font-mono-id bg-[var(--bg-base)]" />
          <Button variant="secondary" size="sm" onClick={() => void copyWebhook()} className="shrink-0 gap-1.5">
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--success)]" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy URL
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)]/30 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--danger-fg)]">
          Danger zone
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Permanently delete this project with all its issues, columns and sprints. This
          cannot be undone.
        </p>
        <div className="mt-3">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--danger)]/40 bg-[var(--bg-raised)] px-3 py-2.5">
              <span className="text-xs font-medium">
                Type-to-confirm is off — are you absolutely sure?
              </span>
              <span className="ml-auto flex gap-2">
                <Button size="xs" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
                <Button size="xs" variant="danger" onClick={() => void deleteProject()} className="gap-1">
                  {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  Delete forever
                </Button>
              </span>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Delete project…
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
