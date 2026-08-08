import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { completeSprint } from "@/lib/api/sprints";
import { completeSprintSchema } from "@/lib/validation/sprint";
import { z } from "zod";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
    sprintId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  const { sprintId } = await params;
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = completeSprintSchema.parse(body);

    const completed = await completeSprint({
      sprintId,
      incompleteAction: parsed.incompleteAction,
      nextSprintId: parsed.nextSprintId,
      userId: actor.user.id,
    });

    return NextResponse.json({ sprint: completed });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    console.error("Failed to complete sprint:", error);
    return NextResponse.json({ error: "Failed to complete sprint" }, { status: 500 });
  }
}
