import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { getCurrentUser } from "@/lib/api/auth";
import ProjectBoardClient from "./board-client";

interface ProjectPageProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor?.user.id);

  if (!project) {
    notFound();
  }

  return (
    <ProjectBoardClient
      project={project}
      workspaceSlug={workspaceSlug}
      currentUser={actor?.user || null}
    />
  );
}
