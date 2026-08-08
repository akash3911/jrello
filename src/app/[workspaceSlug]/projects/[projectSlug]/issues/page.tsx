import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { listProjectIssues } from "@/lib/api/issues";
import { getCurrentUser } from "@/lib/api/auth";
import ProjectIssuesListClient from "./issues-client";

interface IssuesPageProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export default async function ProjectIssuesPage({ params }: IssuesPageProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor?.user.id);
  if (!project) {
    notFound();
  }

  const issues = await listProjectIssues({ projectId: project.id });

  const fullProject = {
    ...project,
    statuses: project.statuses || [],
    issues: issues || [],
  };

  return (
    <ProjectIssuesListClient
      project={fullProject}
      workspaceSlug={workspaceSlug}
      currentUser={actor?.user || null}
    />
  );
}
