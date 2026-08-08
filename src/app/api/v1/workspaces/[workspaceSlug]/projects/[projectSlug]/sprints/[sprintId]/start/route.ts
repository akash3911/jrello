import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { startSprint } from "@/lib/api/sprints";

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
    const sprint = await startSprint(sprintId, actor.user.id);
    return NextResponse.json({ sprint });
  } catch (error: unknown) {
    console.error("Failed to start sprint:", error);
    const message = error instanceof Error ? error.message : "Failed to start sprint";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
