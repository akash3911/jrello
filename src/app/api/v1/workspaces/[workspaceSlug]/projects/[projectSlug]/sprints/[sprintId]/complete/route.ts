import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { completeSprint } from "@/lib/api/sprints";
import { completeSprintSchema } from "@/lib/validation/sprint";
import { apiDataError, apiUnauthorized } from "@/lib/api/response";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
    sprintId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  const actor = await getCurrentUser();
  if (!actor) return apiUnauthorized();

  try {
    const { sprintId } = await params;
    const parsed = completeSprintSchema.parse(await req.json().catch(() => ({})));

    const sprint = await completeSprint({
      sprintId,
      incompleteAction: parsed.incompleteAction,
      nextSprintId: parsed.nextSprintId,
    });

    return NextResponse.json({ sprint });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Sprint")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return apiDataError("complete sprint", error);
  }
}
