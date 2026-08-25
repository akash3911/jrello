import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getProjectBySlug } from "@/lib/api/projects";
import { createIssue, listProjectIssues } from "@/lib/api/issues";
import { createIssueSchema } from "@/lib/validation/issue";
import { apiDataError, apiNotFound, apiUnauthorized } from "@/lib/api/response";
import { IssuePriority } from "@prisma/client";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor?.user.id);
  if (!project) return apiNotFound("Project");

  const url = new URL(req.url);
  const priority = url.searchParams.get("priority");
  const issues = await listProjectIssues({
    projectId: project.id,
    statusId: url.searchParams.get("statusId") || undefined,
    priority: priority && priority in IssuePriority ? (priority as IssuePriority) : undefined,
    assigneeId: url.searchParams.get("assigneeId") || undefined,
    search: url.searchParams.get("search") || undefined,
  });

  return NextResponse.json({ issues });
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) return apiUnauthorized();

  try {
    const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
    if (!project) return apiNotFound("Project");

    const parsed = createIssueSchema.parse(await req.json());

    // Validate assignee is a member of the workspace
    if (parsed.assigneeId) {
      const isMember = project.members.some((m) => m.userId === parsed.assigneeId);
      if (!isMember) {
        return Response.json(
          { error: "Assignee must be a project member" },
          { status: 400 }
        );
      }
    }

    const issue = await createIssue({
      projectId: project.id,
      title: parsed.title,
      description: parsed.description ?? null,
      statusId: parsed.statusId,
      statusKind: parsed.statusKind,
      priority: parsed.priority,
      estimate: parsed.estimate ?? null,
      assigneeId: parsed.assigneeId ?? null,
      labelIds: parsed.labelIds ?? [],
      sprintId: null,
      userId: actor.user.id,
    });

    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    return apiDataError("create issue", error);
  }
}
