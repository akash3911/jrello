import { prisma } from "@/lib/db";
import { WorkspaceRole } from "@prisma/client";

export interface CreateWorkspaceParams {
  name: string;
  slug: string;
  description?: string;
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

  // Create Workspace and add Creator as OWNER
  return await prisma.workspace.create({
    data: {
      name: name.trim(),
      slug: normalizedSlug,
      description: description?.trim(),
      members: {
        create: {
          userId,
          role: WorkspaceRole.OWNER,
        },
      },
      ...(initialProject
        ? {
            projects: {
              create: {
                name: initialProject.name.trim(),
                slug: initialProject.slug.toLowerCase().trim(),
                key: initialProject.key.toUpperCase().trim(),
                members: {
                  create: {
                    userId,
                    role: "ADMIN",
                  },
                },
              },
            },
          }
        : {}),
    },
    include: {
      members: true,
      projects: true,
    },
  });
}

export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          projects: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));
}

export async function getWorkspaceBySlug(slug: string, userId?: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: slug.toLowerCase() },
    include: {
      projects: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  // If userId is passed, verify tenancy membership
  if (userId) {
    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      return null;
    }
  }

  return workspace;
}
