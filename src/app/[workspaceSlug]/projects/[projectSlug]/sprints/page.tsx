import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { getCurrentUser } from "@/lib/api/auth";
import { listProjectSprints } from "@/lib/api/sprints";
import { listProjectIssues } from "@/lib/api/issues";
import SprintPlanningClient, {
  type SprintItem,
  type SprintIssueItem,
} from "./planning-client";

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) notFound();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
  if (!project) notFound();

  const [sprints, allIssues] = await Promise.all([
    listProjectSprints(project.id),
    listProjectIssues({ projectId: project.id }),
  ]);

  const sprintIssueIds = new Set(
    sprints.flatMap((s) => s.issues.map((i) => i.id))
  );

  // Anything not attached to a sprint is product backlog
  const backlogIssues: SprintIssueItem[] = allIssues
    .filter((i) => !sprintIssueIds.has(i.id))
    .map((i) => ({
      id: i.id,
      key: `${project.key}-${i.number}`,
      number: i.number,
      title: i.title,
      estimate: i.estimate,
      priority: i.priority,
      statusKind: i.status.kind,
    }));

  return (
    <SprintPlanningClient
      projectKey={project.key}
      projectSlug={project.slug}
      workspaceSlug={workspaceSlug}
      initialSprints={
        sprints.map((s) => ({
          id: s.id,
          name: s.name,
          goal: s.goal,
          state: s.state as SprintItem["state"],
          startDate: s.startDate.toISOString(),
          endDate: s.endDate.toISOString(),
          issues: s.issues.map((i) => ({
            id: i.id,
            key: `${project.key}-${i.number}`,
            number: i.number,
            title: i.title,
            estimate: i.estimate,
            priority: i.priority,
            statusKind: i.status.kind,
          })),
        })) as SprintItem[]
      }
      backlogIssues={backlogIssues}
    />
  );
}
