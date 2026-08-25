import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { createWorkspace, getUserWorkspaces } from "@/lib/api/workspaces";
import {
  apiDataError,
  apiUnauthorized,
} from "@/lib/api/response";
import { createWorkspaceSchema } from "@/lib/validation/workspace";

export async function GET() {
  const actor = await getCurrentUser();
  if (!actor) return apiUnauthorized();

  const workspaces = await getUserWorkspaces(actor.user.id);
  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor) return apiUnauthorized();

  try {
    const data = createWorkspaceSchema.parse(await req.json());

    const workspace = await createWorkspace({
      name: data.name,
      slug: data.slug,
      userId: actor.user.id,
      initialProject: data.initialProject,
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    return apiDataError("create workspace", error);
  }
}
