import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { createWorkspace, getUserWorkspaces } from "@/lib/api/workspaces";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  initialProject: z
    .object({
      name: z.string().min(2).max(100),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
      key: z.string().min(2).max(6).regex(/^[A-Z]+$/),
    })
    .optional(),
});

export async function GET() {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await getUserWorkspaces(actor.user.id);
  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createWorkspaceSchema.parse(body);

    const workspace = await createWorkspace({
      name: data.name,
      slug: data.slug,
      userId: actor.user.id,
      initialProject: data.initialProject,
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create workspace:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}
