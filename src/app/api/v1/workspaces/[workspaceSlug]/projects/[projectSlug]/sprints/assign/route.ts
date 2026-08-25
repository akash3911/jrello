import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getProjectBySlug } from "@/lib/api/projects";
import { assignIssueToSprint } from "@/lib/api/sprints";
import { apiDataError, apiNotFound, apiUnauthorized } from "@/lib/api/response";
import { z } from "zod";

const bodySchema = z.object({
  issueId: z.string().uuid(),
  sprintId: z.string().uuid().nullable(),
});

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
  }>;
}

/** Move an issue into a sprint (or back to the backlog with sprintId: null). */
export async function POST(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) return apiUnauthorized();

  try {
    const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
    if (!project) return apiNotFound("Project");

    const parsed = bodySchema.parse(await req.json());

    const updated = await assignIssueToSprint({
      issueId: parsed.issueId,
      sprintId: parsed.sprintId,
    });

    return NextResponse.json({ issue: updated });
  } catch (error) {
    return apiDataError("assign issue to sprint", error);
  }
}
