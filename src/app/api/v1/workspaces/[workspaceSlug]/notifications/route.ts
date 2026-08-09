import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { getWorkspaceBySlug } from "@/lib/api/workspaces";
import {
  listUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "@/lib/api/notifications";

interface RouteProps {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug } = await params;
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug, actor.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const notifications = await listUserNotifications(actor.user.id, workspace.id);
  const unreadCount = await getUnreadNotificationCount(actor.user.id, workspace.id);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  const { workspaceSlug } = await params;
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug, actor.user.id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  await markAllNotificationsRead(actor.user.id, workspace.id);
  return NextResponse.json({ success: true });
}
