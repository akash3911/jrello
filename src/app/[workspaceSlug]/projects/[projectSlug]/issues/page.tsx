import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { getCurrentUser } from "@/lib/api/auth";
import ProjectIssuesListClient from "./issues-client";

interface IssuesListPageProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export default async function IssuesListPage({ params }: IssuesListPageProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor?.user.id);

  if (!project) {
    notFound();
  }

  return (
    <ProjectIssuesListClient
      project={project}
      workspaceSlug={workspaceSlug}
      currentUser={actor?.user || null}
    />
  );
}
