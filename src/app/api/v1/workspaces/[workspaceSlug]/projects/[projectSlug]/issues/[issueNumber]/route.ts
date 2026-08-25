import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getProjectBySlug, getWorkspaceRoleForProject } from "@/lib/api/projects";
import { getIssueByKey, updateIssueDetails, softDeleteIssue } from "@/lib/api/issues";
import { updateIssueSchema } from "@/lib/validation/issue";
import { canManageWorkspace, canManageProject, canEditIssue, WorkspaceRoleLike, ProjectRoleLike } from "@/lib/permissions";
import { apiDataError, apiNotFound, apiUnauthorized } from "@/lib/api/response";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
    issueNumber: string;
  }>;
}

async function resolveContext(
  workspaceSlug: string,
  projectSlugOrKey: string,
  issueNumber: string,
  requireActor: boolean
) {
  const num = Number.parseInt(issueNumber, 10);
  if (Number.isNaN(num)) return { error: "Invalid issue number" as const };

  const actor = await getCurrentUser();
  if (requireActor && !actor) return { error: "Unauthorized" as const };

  const project = await getProjectBySlug(
    workspaceSlug,
    projectSlugOrKey,
    actor?.user.id
  );
  if (!project) return { error: "NotFound" as const };

  const issue = await getIssueByKey({
    workspaceSlug,
    projectKey: project.key,
    number: num,
  });
  if (!issue) return { error: "NotFound" as const, actor, project };

  return { issue, actor, project };
}

export async function GET(_req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug, issueNumber } = await params;
  const result = await resolveContext(workspaceSlug, projectSlug, issueNumber, false);

  if ("error" in result) {
    if (result.error === "NotFound") return apiNotFound("Issue");
    return Response.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ issue: result.issue });
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug, issueNumber } = await params;

  try {
    const result = await resolveContext(workspaceSlug, projectSlug, issueNumber, true);
    if ("error" in result || !result.issue) {
      if (result.error === "Unauthorized") return apiUnauthorized();
      if (result.error === "NotFound") return apiNotFound("Issue");
      return Response.json({ error: result.error }, { status: 400 });
    }
    const { issue, actor, project } = result;

    const workspaceRole = (await getWorkspaceRoleForProject(
      project!.workspaceId,
      actor!.user.id
    )) as WorkspaceRoleLike | null;
    const projectRole = (project!.members.find((m) => m.userId === actor!.user.id)
      ?.role ?? null) as ProjectRoleLike | null;

    if (!canEditIssue(projectRole) && !canManageWorkspace(workspaceRole) && !canManageProject(workspaceRole, projectRole)) {
      return Response.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const parsed = updateIssueSchema.parse(await req.json());

    // Validate assignee is a member
    if (parsed.assigneeId) {
      const isMember = project!.members.some((m) => m.userId === parsed.assigneeId);
      if (!isMember) {
        return Response.json(
          { error: "Assignee must be a project member" },
          { status: 400 }
        );
      }
    }

    const updated = await updateIssueDetails({
      issueId: issue.id,
      userId: actor!.user.id,
      changes: parsed,
    });

    return NextResponse.json({ issue: updated });
  } catch (error) {
    return apiDataError("update issue", error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug, issueNumber } = await params;

  try {
    const result = await resolveContext(workspaceSlug, projectSlug, issueNumber, true);
    if ("error" in result || !result.issue) {
      if (result.error === "Unauthorized") return apiUnauthorized();
      if (result.error === "NotFound") return apiNotFound("Issue");
      return Response.json({ error: result.error }, { status: 400 });
    }

    await softDeleteIssue(result.issue.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiDataError("delete issue", error);
  }
}
