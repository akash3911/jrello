import { prisma } from "@/lib/db";
import { WorkspaceRole, ProjectRole, IssueStatusKind } from "@prisma/client";

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
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
  userId,
  initialProject,
}: CreateWorkspaceInput) {
  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

  return await prisma.$transaction(async (tx) => {
    // 1. Create the workspace
    const workspace = await tx.workspace.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
      },
    });

    // 2. Add creator as OWNER
    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: WorkspaceRole.OWNER,
      },
    });

    // 3. If an initial project is requested, create it and seed default statuses
    if (initialProject) {
      const projectSlug = initialProject.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "");
      const projectKey = initialProject.key.toUpperCase().trim();

      const project = await tx.project.create({
        data: {
          workspaceId: workspace.id,
          name: initialProject.name.trim(),
          slug: projectSlug,
          key: projectKey,
        },
      });

      // Add user as Project ADMIN
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: ProjectRole.ADMIN,
        },
      });

      // Seed default Kanban statuses per DATABASE.md
      const defaultStatuses: {
        name: string;
        kind: IssueStatusKind;
        position: number;
        isDefault?: boolean;
      }[] = [
        { name: "Backlog", kind: IssueStatusKind.BACKLOG, position: 1000 },
        { name: "Todo", kind: IssueStatusKind.TODO, position: 2000, isDefault: true },
        { name: "In Progress", kind: IssueStatusKind.IN_PROGRESS, position: 3000 },
        { name: "In Review", kind: IssueStatusKind.IN_REVIEW, position: 4000 },
        { name: "Done", kind: IssueStatusKind.DONE, position: 5000 },
      ];

      for (const st of defaultStatuses) {
        await tx.issueStatus.create({
          data: {
            projectId: project.id,
            name: st.name,
            kind: st.kind,
            position: st.position,
            isDefault: st.isDefault || false,
          },
        });
      }
    }

    return workspace;
  });
}

export async function getUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          projects: {
            where: { deletedAt: null },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
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
      projects: {
        where: { deletedAt: null },
      },
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

  if (!workspace || workspace.deletedAt) {
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
