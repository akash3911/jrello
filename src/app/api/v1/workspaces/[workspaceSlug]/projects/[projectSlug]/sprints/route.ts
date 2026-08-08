import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getProjectBySlug } from "@/lib/api/projects";
import { createSprint, listProjectSprints } from "@/lib/api/sprints";
import { createSprintSchema } from "@/lib/validation/sprint";
import { z } from "zod";

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
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const sprints = await listProjectSprints(project.id);
  return NextResponse.json({ sprints });
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug } = await params;
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectBySlug(workspaceSlug, projectSlug, actor.user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = createSprintSchema.parse(body);

    const sprint = await createSprint({
      projectId: project.id,
      name: parsed.name,
      goal: parsed.goal,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      userId: actor.user.id,
    });

    return NextResponse.json({ sprint }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create sprint:", error);
    return NextResponse.json({ error: "Failed to create sprint" }, { status: 500 });
  }
}
