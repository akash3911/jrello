import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import {
  getProjectBySlug,
  updateProjectDetails,
  deleteProject,
  getWorkspaceRoleForProject,
} from "@/lib/api/projects";
import { canManageWorkspace, canManageProject, WorkspaceRoleLike, ProjectRoleLike } from "@/lib/permissions";
import { apiDataError, apiNotFound, apiUnauthorized } from "@/lib/api/response";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export async function GET(_req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor?.user.id);
  if (!project) return apiNotFound("Project");

  return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) return apiUnauthorized();

  try {
    const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
    if (!project) return apiNotFound("Project");

    const workspaceRole = (await getWorkspaceRoleForProject(
      project.workspaceId,
      actor.user.id
    )) as WorkspaceRoleLike | null;
    const projectRole = (project.members.find((m) => m.userId === actor.user.id)
      ?.role ?? null) as ProjectRoleLike | null;

    if (!canManageWorkspace(workspaceRole) && !canManageProject(workspaceRole, projectRole)) {
      return Response.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = (await req.json()) as { name?: string; description?: string | null };
    if (body.name !== undefined && body.name.trim().length < 2) {
      return Response.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const updated = await updateProjectDetails(project.id, {
      name: body.name?.trim() || undefined,
      description: body.description ?? undefined,
    });

    return NextResponse.json({ project: updated });
  } catch (error) {
    return apiDataError("update project", error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) return apiUnauthorized();

  try {
    const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
    if (!project) return apiNotFound("Project");

    const workspaceRole = (await getWorkspaceRoleForProject(
      project.workspaceId,
      actor.user.id
    )) as WorkspaceRoleLike | null;
    const projectRole = (project.members.find((m) => m.userId === actor.user.id)
      ?.role ?? null) as ProjectRoleLike | null;

    if (!canManageWorkspace(workspaceRole) && !canManageProject(workspaceRole, projectRole)) {
      return Response.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    await deleteProject(project.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiDataError("delete project", error);
  }
}
