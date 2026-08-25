import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/api/projects";
import { getCurrentUser } from "@/lib/api/auth";
import ProjectSettingsClient from "./settings-client";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) notFound();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
  if (!project) notFound();

  return (
    <ProjectSettingsClient
      workspaceSlug={workspaceSlug}
      project={{
        id: project.id,
        workspaceId: project.workspaceId,
        workspaceName: (project.workspace as unknown as { name: string }).name ?? "",
        name: project.name,
        key: project.key,
        slug: project.slug,
        description: project.description,
        statuses: project.statuses.map((s) => ({
          id: s.id,
          name: s.name,
          kind: s.kind,
          position: s.position,
          isDefault: s.isDefault,
        })),
        members: project.members.map((m) => ({
          id: m.id,
          role: m.role,
          user: {
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            avatarUrl: m.user.avatarUrl,
          },
        })),
        labels: project.labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
      }}
    />
  );
}
