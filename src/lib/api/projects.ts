import "server-only";
import { prisma } from "@/lib/db";
import { ProjectRole, IssueStatusKind } from "@prisma/client";

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  slug: string;
  key: string;
  description?: string | null;
  userId: string;
}

export const DEFAULT_STATUSES: {
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

export async function createProject({
  workspaceId,
  name,
  slug,
  key,
  description,
  userId,
}: CreateProjectInput) {
  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
  const cleanKey = key.toUpperCase().trim().replace(/[^A-Z]/g, "");

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        workspaceId,
        name: name.trim(),
        slug: cleanSlug,
        key: cleanKey,
        description: description?.trim() || null,
      },
    });

    await tx.projectMember.create({
      data: { projectId: project.id, userId, role: ProjectRole.ADMIN },
    });

    // Seed the canonical kanban workflow
    await tx.issueStatus.createMany({
      data: DEFAULT_STATUSES.map((s) => ({
        projectId: project.id,
        name: s.name,
        kind: s.kind,
        position: s.position,
        isDefault: s.isDefault ?? false,
      })),
    });

    return project;
  });
}

/**
 * Resolve a project by its slug or by its issue-key prefix.
 * Accepting both keeps URLs forgiving for clients that only know the key
 * (e.g. boards addressing issues as CORE-12).
 */
export function getProjectBySlug(
  workspaceSlug: string,
  projectSlugOrKey: string,
  userId?: string
) {
  const token = projectSlugOrKey.toLowerCase();
  return prisma.project.findFirst({
    where: {
      OR: [{ slug: token }, { key: token }],
      workspace: {
        slug: workspaceSlug.toLowerCase(),
        ...(userId ? { members: { some: { userId } } } : {}),
      },
    },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      statuses: { where: { deletedAt: null }, orderBy: { position: "asc" } },
      labels: { orderBy: { createdAt: "asc" } },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
      _count: { select: { issues: { where: { deletedAt: null } } } },
    },
  });
}

export async function updateProjectDetails(
  projectId: string,
  changes: { name?: string; description?: string | null }
) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      name: changes.name !== undefined ? changes.name.trim() : undefined,
      description:
        changes.description !== undefined
          ? changes.description?.trim() || null
          : undefined,
    },
  });
}

/** Hard-delete a project and all nested records (statuses cascade). */
export async function deleteProject(projectId: string) {
  return prisma.project.delete({ where: { id: projectId } });
}

export async function getWorkspaceRoleForProject(
  workspaceId: string,
  userId: string
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}
