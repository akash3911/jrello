import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { getCurrentUser } from "@/lib/api/auth";
import ProjectSettingsClient from "./settings-client";

interface SettingsPageProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export default async function ProjectSettingsPage({ params }: SettingsPageProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor?.user.id);

  if (!project) {
    notFound();
  }

  return (
    <ProjectSettingsClient
      project={project}
      workspaceSlug={workspaceSlug}
      currentUser={actor?.user || null}
    />
  );
}
