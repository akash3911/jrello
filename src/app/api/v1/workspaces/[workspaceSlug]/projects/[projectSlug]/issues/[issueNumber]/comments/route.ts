import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getIssueByKey, addComment } from "@/lib/api/issues";
import { createCommentSchema } from "@/lib/validation/issue";
import { apiDataError, apiNotFound, apiUnauthorized } from "@/lib/api/response";

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
  if (!actor) return apiUnauthorized();

  try {
    const num = Number.parseInt(issueNumber, 10);
    if (Number.isNaN(num)) {
      return Response.json({ error: "Invalid issue number" }, { status: 400 });
    }

    const issue = await getIssueByKey({
      workspaceSlug,
      projectKey: projectSlug,
      number: num,
    });
    if (!issue) return apiNotFound("Issue");

    const parsed = createCommentSchema.parse(await req.json());

    const comment = await addComment({
      issueId: issue.id,
      userId: actor.user.id,
      body: parsed.body,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return apiDataError("add comment", error);
  }
}
