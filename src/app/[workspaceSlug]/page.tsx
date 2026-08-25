import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/api/auth";
import { getWorkspaceBySlug } from "@/lib/api/workspaces";

export default async function WorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) notFound();

  const workspace = await getWorkspaceBySlug(workspaceSlug, actor.user.id);
  if (!workspace) notFound();

  if (workspace.projects.length > 0) {
    // Hand off to the most recent project
    const first = workspace.projects[0];
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] p-6 text-center shadow-[var(--shadow-xs)]">
          <h1 className="text-sm font-semibold">{first.name}</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Jump into your project board to start tracking work.
          </p>
          <Link
            href={`/${workspace.slug}/projects/${first.slug}`}
            className="mt-4 inline-flex h-8 items-center rounded-[var(--radius-md)] bg-[var(--accent)] px-3.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Open board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dot-grid flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        <Plus className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-base font-semibold">Set up {workspace.name}</h1>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[var(--text-muted)]">
          This workspace has no projects yet. Create your first project to get a
          kanban board, issues, and sprints.
        </p>
      </div>
      <Link
        href="/onboarding"
        className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
      >
        <Plus className="h-3.5 w-3.5" /> Create project
      </Link>
    </div>
  );
}
