import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getProjectBySlug } from "@/lib/api/projects";
import { createSprint, listProjectSprints } from "@/lib/api/sprints";
import { createSprintSchema } from "@/lib/validation/sprint";
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

  const sprints = await listProjectSprints(project.id);
  return NextResponse.json({ sprints });
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();
  if (!actor) return apiUnauthorized();

  try {
    const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
    if (!project) return apiNotFound("Project");

    const parsed = createSprintSchema.parse(await req.json());

    if (new Date(parsed.endDate) <= new Date(parsed.startDate)) {
      return Response.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const sprint = await createSprint({
      projectId: project.id,
      name: parsed.name,
      goal: parsed.goal ?? null,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
    });

    return NextResponse.json({ sprint }, { status: 201 });
  } catch (error) {
    return apiDataError("create sprint", error);
  }
}
