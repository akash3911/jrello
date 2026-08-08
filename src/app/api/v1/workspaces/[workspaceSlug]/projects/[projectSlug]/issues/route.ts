import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getProjectBySlug } from "@/lib/api/projects";
import { createIssue, listProjectIssues } from "@/lib/api/issues";
import { createIssueSchema } from "@/lib/validation/issue";
import { IssuePriority } from "@prisma/client";
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

  const url = new URL(req.url);
  const statusId = url.searchParams.get("statusId") || undefined;
  const priority = (url.searchParams.get("priority") as IssuePriority) || undefined;
  const assigneeId = url.searchParams.get("assigneeId") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const issues = await listProjectIssues({
    projectId: project.id,
    statusId,
    priority,
    assigneeId,
    search,
  });

  return NextResponse.json({ issues });
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
    const parsed = createIssueSchema.parse({
      ...body,
      projectId: project.id,
    });

    const issue = await createIssue({
      projectId: project.id,
      title: parsed.title,
      description: parsed.description,
      statusId: parsed.statusId,
      priority: parsed.priority,
      estimate: parsed.estimate,
      assigneeId: parsed.assigneeId,
      labelIds: parsed.labelIds,
      userId: actor.user.id,
    });

    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create issue:", error);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
