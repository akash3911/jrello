import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";
import { createProject } from "@/lib/api/projects";
import { z } from "zod";

const createProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  key: z.string().min(2).max(6).regex(/^[A-Z]+$/),
  description: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createProjectSchema.parse(body);

    const project = await createProject({
      workspaceId: data.workspaceId,
      name: data.name,
      slug: data.slug,
      key: data.key,
      description: data.description,
      userId: actor.user.id,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
