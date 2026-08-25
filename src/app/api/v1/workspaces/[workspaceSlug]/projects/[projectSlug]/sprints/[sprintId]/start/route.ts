import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { startSprint } from "@/lib/api/sprints";
import { apiDataError, apiUnauthorized } from "@/lib/api/response";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
    sprintId: string;
  }>;
}

export async function POST(_req: NextRequest, { params }: RouteProps) {
  const actor = await getCurrentUser();
  if (!actor) return apiUnauthorized();

  try {
    const { sprintId } = await params;
    const sprint = await startSprint(sprintId);
    return NextResponse.json({ sprint });
  } catch (error) {
    // Domain rule violations (e.g. another sprint active) are client errors
    if (error instanceof Error && !/^\[/.test(error.message)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return apiDataError("start sprint", error);
  }
}
