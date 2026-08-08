import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getIssueByKey, moveIssue } from "@/lib/api/issues";
import { moveIssueSchema } from "@/lib/validation/issue";
import { z } from "zod";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
    issueNumber: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
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
    const parsed = moveIssueSchema.parse(body);

    const updated = await moveIssue({
      issueId: existing.id,
      targetStatusId: parsed.targetStatusId,
      previousSortOrder: parsed.previousIssueSortOrder,
      nextSortOrder: parsed.nextIssueSortOrder,
      userId: actor.user.id,
    });

    return NextResponse.json({ issue: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    console.error("Failed to move issue:", error);
    return NextResponse.json({ error: "Failed to move issue" }, { status: 500 });
  }
}
