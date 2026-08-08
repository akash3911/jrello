import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getIssueByKey, softDeleteIssue } from "@/lib/api/issues";
import { prisma } from "@/lib/db";
import { updateIssueSchema } from "@/lib/validation/issue";
import { z } from "zod";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
    issueNumber: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug, issueNumber } = await params;
  const num = parseInt(issueNumber, 10);

  if (isNaN(num)) {
    return NextResponse.json({ error: "Invalid issue number" }, { status: 400 });
  }

  const issue = await getIssueByKey({
    workspaceSlug,
    projectKey: projectSlug.toUpperCase(),
    number: num,
  });

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({ issue });
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug, issueNumber } = await params;
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const num = parseInt(issueNumber, 10);
  if (isNaN(num)) {
    return NextResponse.json({ error: "Invalid issue number" }, { status: 400 });
  }

  const existing = await getIssueByKey({
    workspaceSlug,
    projectKey: projectSlug.toUpperCase(),
    number: num,
  });

  if (!existing) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = updateIssueSchema.parse(body);

    const updated = await prisma.issue.update({
      where: { id: existing.id },
      data: {
        title: parsed.title,
        description: parsed.description,
        statusId: parsed.statusId,
        priority: parsed.priority,
        estimate: parsed.estimate,
        assigneeId: parsed.assigneeId,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
      },
      include: {
        status: true,
        assignee: true,
      },
    });

    return NextResponse.json({ issue: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    console.error("Failed to update issue:", error);
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug, projectSlug, issueNumber } = await params;
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const num = parseInt(issueNumber, 10);
  if (isNaN(num)) {
    return NextResponse.json({ error: "Invalid issue number" }, { status: 400 });
  }

  const existing = await getIssueByKey({
    workspaceSlug,
    projectKey: projectSlug.toUpperCase(),
    number: num,
  });

  if (!existing) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  await softDeleteIssue(existing.id);

  return NextResponse.json({ success: true });
}
