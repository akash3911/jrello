import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { markNotificationRead } from "@/lib/api/notifications";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
    id: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markNotificationRead(id, actor.user.id);
  return NextResponse.json({ success: true });
}
