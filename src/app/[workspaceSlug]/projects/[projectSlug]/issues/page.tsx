import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { listProjectIssues } from "@/lib/api/issues";
import { getCurrentUser } from "@/lib/api/auth";
import IssuesListClient from "./issues-client";

export default async function ProjectIssuesPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) notFound();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
  if (!project) notFound();

  const issues = await listProjectIssues({ projectId: project.id });

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-base)] px-6 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--accent)] to-[var(--palette-purple)] font-mono-id text-[11px] font-bold text-white">
          {project.key.slice(0, 4)}
        </span>
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            {project.name} · Issues
          </h1>
          <p className="font-mono-id text-[11px] text-[var(--text-subtle)]">
            All work in {project.name} — filter, sort, and drill in.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <IssuesListClient
          rows={issues.map((i) => ({
            id: i.id,
            key: `${project.key}-${i.number}`,
            title: i.title,
            statusKind: i.status.kind,
            priority: i.priority,
            assignee: i.assignee
              ? {
                  id: i.assignee.id,
                  name: i.assignee.name,
                  avatarUrl: i.assignee.avatarUrl ?? null,
                }
              : null,
            estimate: i.estimate,
            commentsCount:
              typeof i._count === "object" && i._count !== null
                ? (i._count as { comments: number }).comments
                : 0,
            updatedAt: (i.updatedAt as Date).toISOString(),
          }))}
          workspaceSlug={workspaceSlug}
          members={project.members.map((m) => ({
            id: m.id,
            role: m.role,
            user: {
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              avatarUrl: m.user.avatarUrl,
            },
          }))}
        />
      </div>
    </div>
  );
}
