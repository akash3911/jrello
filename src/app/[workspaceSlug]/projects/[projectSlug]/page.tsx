import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { listProjectIssues } from "@/lib/api/issues";
import { getCurrentUser } from "@/lib/api/auth";
import { mapIssue } from "@/lib/board-mapper";
import { KanbanBoard } from "@/components/board/KanbanBoard";

export default async function ProjectBoardPage({
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
    <KanbanBoard
      projectId={project.id}
      projectKey={project.key}
      projectName={project.name}
      projectSlug={project.slug}
      workspaceSlug={workspaceSlug}
      statuses={project.statuses.map((s) => ({
        id: s.id,
        name: s.name,
        kind: s.kind,
        position: s.position,
        isDefault: s.isDefault,
      }))}
      initialIssues={issues.map((i) => mapIssue(i as unknown as Record<string, unknown>, project.key))}
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
      currentUser={{
        id: actor.user.id,
        name: actor.user.name,
        avatarUrl: actor.user.avatarUrl,
        email: actor.user.email,
      }}
    />
  );
}
