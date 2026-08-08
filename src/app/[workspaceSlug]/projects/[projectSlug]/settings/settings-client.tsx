"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  type ProjectData,
  type CurrentUserData,
} from "../board-client";

interface SettingsClientProps {
  project: ProjectData;
  workspaceSlug: string;
  currentUser: CurrentUserData | null;
}

export default function ProjectSettingsClient({
  project,
  workspaceSlug,
}: SettingsClientProps) {
  const router = useRouter();
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description || "");
  const [saving, setSaving] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${project.slug}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description }),
        }
      );

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${project.slug}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        router.push(`/${workspaceSlug}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="flex h-full flex-col min-w-0 bg-[var(--bg-base)] overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[var(--text)] tracking-tight">
                Project Settings
              </h1>
              <Badge variant="mono" size="sm">
                {project.key}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Manage configuration, issue identifier prefixes, and member access for {project.name}.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-4">
              <h2 className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                General Information
              </h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                  Project Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Core Platform"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                  Issue Key Identifier
                </label>
                <Input
                  value={project.key}
                  disabled
                  className="font-mono-id bg-[var(--bg-base)] opacity-70"
                />
                <span className="text-[11px] text-[var(--text-subtle)]">
                  Key prefix cannot be modified after project creation to prevent broken git branch links.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of this codebase or feature unit..."
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] p-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-subtle)] focus-ring outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                {savedSuccess ? (
                  <span className="text-xs text-[var(--success)] font-medium">
                    Changes saved successfully
                  </span>
                ) : (
                  <span />
                )}

                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={saving}
                  className="text-xs"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Team Members Section */}
            <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-4">
              <h2 className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                Project Roster
              </h2>
              <div className="divide-y divide-[var(--border)]/50">
                <div className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Avatar fallback="ME" size="xs" />
                    <span className="font-medium text-[var(--text)]">Project Owner</span>
                  </div>
                  <Badge variant="accent" size="sm">ADMIN</Badge>
                </div>
                <div className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Avatar fallback="SC" size="xs" />
                    <span className="font-medium text-[var(--text)]">Sarah Chen</span>
                  </div>
                  <Badge variant="default" size="sm">MEMBER</Badge>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-5 rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] flex flex-col gap-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-semibold text-[var(--danger-fg)] uppercase">
                  Danger Zone
                </h3>
                <p className="text-xs text-[var(--danger-fg)]/80 mt-0.5">
                  Deleting a project soft-deletes its issues and statuses. This can be recovered by a workspace owner.
                </p>
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  onClick={handleDeleteProject}
                  className="text-xs"
                >
                  Delete Project
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
