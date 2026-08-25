import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { getCurrentUser } from "@/lib/api/auth";
import { getSprintVelocityReport } from "@/lib/api/sprints";
import SprintReportClient from "./reports-client";

export default async function SprintReportsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) notFound();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
  if (!project) notFound();

  const report = await getSprintVelocityReport(project.id);

  return (
    <SprintReportClient
      projectName={project.name}
      projectSlug={project.slug}
      workspaceSlug={workspaceSlug}
      velocity={report.velocity}
      averageVelocity={report.averageVelocity}
      reliability={report.reliability}
      activeSprint={
        report.activeSprintStats
          ? {
              id: report.activeSprintStats.id,
              name: report.activeSprintStats.name,
              totalIssues: report.activeSprintStats.totalIssues,
              totalPoints: report.activeSprintStats.totalPoints,
              donePoints: report.activeSprintStats.donePoints,
              endDate: report.activeSprintStats.endDate,
            }
          : null
      }
    />
  );
}
