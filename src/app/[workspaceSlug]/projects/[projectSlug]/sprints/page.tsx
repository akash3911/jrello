import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { getCurrentUser } from "@/lib/api/auth";
import { listProjectSprints } from "@/lib/api/sprints";
import { listProjectIssues } from "@/lib/api/issues";
import SprintPlanningClient from "./planning-client";

interface SprintsPageProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export default async function SprintsPage({ params }: SprintsPageProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor?.user.id);
  if (!project) {
    notFound();
  }

  const sprints = await listProjectSprints(project.id);
  const backlogIssues = await listProjectIssues({
    projectId: project.id,
  });

  return (
    <SprintPlanningClient
      project={project}
      sprints={sprints}
      backlogIssues={backlogIssues}
      workspaceSlug={workspaceSlug}
      currentUser={actor?.user || null}
    />
  );
}
