import "server-only";
import { prisma } from "@/lib/db";
import { WorkspaceRole } from "@prisma/client";
import { DEFAULT_STATUSES } from "./projects";

export interface CreateWorkspaceParams {
  name: string;
  slug: string;
  description?: string | null;
  userId: string;
  initialProject?: {
    name: string;
    slug: string;
    key: string;
  };
}

export async function createWorkspace({
  name,
  slug,
  description,
  userId,
  initialProject,
}: CreateWorkspaceParams) {
  const normalizedSlug = slug.toLowerCase().trim();

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: name.trim(),
        slug: normalizedSlug,
        description: description?.trim() || null,
        members: { create: { userId, role: WorkspaceRole.OWNER } },
      },
    });

    if (initialProject) {
      const cleanSlug = initialProject.slug.toLowerCase().trim();
      const cleanKey = initialProject.key.toUpperCase().trim();

      const project = await tx.project.create({
        data: {
          workspaceId: workspace.id,
          name: initialProject.name.trim(),
          slug: cleanSlug,
          key: cleanKey,
          members: { create: { userId, role: "ADMIN" } },
        },
      });

      // Seed the canonical kanban workflow for the first project
      await tx.issueStatus.createMany({
        data: DEFAULT_STATUSES.map((s) => ({
          projectId: project.id,
          name: s.name,
          kind: s.kind,
          position: s.position,
          isDefault: s.isDefault ?? false,
        })),
      });
    }

    return tx.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: true, projects: true },
    });
  });
}

export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: { _count: { select: { projects: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    logoUrl: m.workspace.logoUrl,
    role: m.role,
    projectCount: m.workspace._count.projects,
  }));
}

export function getWorkspaceBySlug(slug: string, userId?: string) {
  return prisma.workspace.findFirst({
    where: {
      slug: slug.toLowerCase(),
      ...(userId ? { members: { some: { userId } } } : {}),
    },
    include: {
      projects: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { issues: { where: { deletedAt: null } } } } },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
