import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { getCurrentUser } from "@/lib/api/auth";
import { getSprintVelocityReport } from "@/lib/api/sprints";
import SprintReportClient from "./reports-client";

interface ReportsPageProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export default async function SprintReportsPage({ params }: ReportsPageProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor?.user.id);
  if (!project) {
    notFound();
  }

  const report = await getSprintVelocityReport(project.id);

  return (
    <SprintReportClient
      project={project}
      report={report}
      workspaceSlug={workspaceSlug}
    />
  );
}
