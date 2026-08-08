import { prisma } from "@/lib/db";
import { ProjectRole, IssueStatusKind, IssuePriority } from "@prisma/client";

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  slug: string;
  key: string;
  description?: string;
  userId: string;
}

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

  return await prisma.$transaction(async (tx) => {
    // 1. Create project
    const project = await tx.project.create({
      data: {
        workspaceId,
        name: name.trim(),
        slug: cleanSlug,
        key: cleanKey,
        description: description?.trim() || null,
      },
    });

    // 2. Add creator as project ADMIN
    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        role: ProjectRole.ADMIN,
      },
    });

    // 3. Seed canonical Kanban statuses per DATABASE.md
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

    for (const status of defaultStatuses) {
      await tx.issueStatus.create({
        data: {
          projectId: project.id,
          name: status.name,
          kind: status.kind,
          position: status.position,
          isDefault: status.isDefault || false,
        },
      });
    }

    return project;
  });
}

export async function getProjectBySlug(workspaceSlug: string, projectSlug: string, userId?: string) {
  const project = await prisma.project.findFirst({
    where: {
      slug: projectSlug.toLowerCase(),
      workspace: {
        slug: workspaceSlug.toLowerCase(),
        deletedAt: null,
        ...(userId ? { members: { some: { userId } } } : {}),
      },
      deletedAt: null,
    },
    include: {
      workspace: true,
      statuses: {
        orderBy: { position: "asc" },
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
      issues: {
        where: { deletedAt: null },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          status: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return project;
}

export async function createIssueInProject({
  projectId,
  title,
  description,
  statusId,
  priority = IssuePriority.NONE,
  estimate,
  assigneeId,
  createdById,
}: {
  projectId: string;
  title: string;
  description?: string;
  statusId: string;
  priority?: IssuePriority;
  estimate?: number;
  assigneeId?: string;
  createdById: string;
}) {
  return await prisma.$transaction(async (tx) => {
    // Determine next sequential issue number for this project (transactional MAX(number) + 1)
    const lastIssue = await tx.issue.findFirst({
      where: { projectId },
      orderBy: { number: "desc" },
      select: { number: true },
    });

    const nextNumber = (lastIssue?.number ?? 0) + 1;

    // Determine sortOrder at the end of the column
    const lastInColumn = await tx.issue.findFirst({
      where: { projectId, statusId, deletedAt: null },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const sortOrder = (lastInColumn?.sortOrder ?? 0) + 1000;

    const issue = await tx.issue.create({
      data: {
        projectId,
        number: nextNumber,
        title: title.trim(),
        description: description?.trim() || null,
        statusId,
        priority,
        sortOrder,
        estimate,
        assigneeId: assigneeId || null,
        createdById,
      },
      include: {
        project: true,
        status: true,
        assignee: true,
      },
    });

    return issue;
  });
}
