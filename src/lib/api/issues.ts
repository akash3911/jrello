import { prisma } from "@/lib/db";
import { IssuePriority, ActivityType, Prisma } from "@prisma/client";

export interface CreateIssueParams {
  projectId: string;
  title: string;
  description?: string | null;
  statusId?: string;
  priority?: IssuePriority;
  estimate?: number | null;
  assigneeId?: string | null;
  labelIds?: string[];
  userId: string;
}

export async function createIssue({
  projectId,
  title,
  description,
  statusId,
  priority = IssuePriority.NONE,
  estimate,
  assigneeId,
  labelIds = [],
  userId,
}: CreateIssueParams) {
  return await prisma.$transaction(async (tx) => {
    // 1. If statusId is not provided, use the default status of the project
    let resolvedStatusId = statusId;
    if (!resolvedStatusId) {
      const defaultStatus = await tx.issueStatus.findFirst({
        where: { projectId, deletedAt: null },
        orderBy: [{ isDefault: "desc" }, { position: "asc" }],
      });
      if (!defaultStatus) {
        throw new Error("Project has no configured statuses.");
      }
      resolvedStatusId = defaultStatus.id;
    }

    // 2. Determine monotonic issue number for this project (MAX(number) + 1)
    const highestIssue = await tx.issue.findFirst({
      where: { projectId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const nextNumber = (highestIssue?.number ?? 0) + 1;

    // 3. Determine sortOrder at the end of the column
    const lastInColumn = await tx.issue.findFirst({
      where: { projectId, statusId: resolvedStatusId, deletedAt: null },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSortOrder = (lastInColumn?.sortOrder ?? 0) + 1000;

    // 4. Create the issue
    const issue = await tx.issue.create({
      data: {
        projectId,
        number: nextNumber,
        title: title.trim(),
        description: description?.trim() || null,
        statusId: resolvedStatusId,
        priority,
        sortOrder: nextSortOrder,
        estimate: estimate || null,
        assigneeId: assigneeId || null,
        createdById: userId,
      },
      include: {
        project: true,
        status: true,
        assignee: true,
        createdBy: true,
      },
    });

    // 5. Attach any labels
    if (labelIds.length > 0) {
      for (const labelId of labelIds) {
        await tx.issueLabelAssignment.create({
          data: {
            issueId: issue.id,
            labelId,
          },
        });
      }
    }

    // 6. Log Activity: ISSUE_CREATED
    await tx.activity.create({
      data: {
        issueId: issue.id,
        actorId: userId,
        type: ActivityType.ISSUE_CREATED,
        payload: {
          number: nextNumber,
          title: issue.title,
          statusName: issue.status.name,
        } as Prisma.JsonObject,
      },
    });

    return issue;
  });
}

export async function listProjectIssues({
  projectId,
  statusId,
  priority,
  assigneeId,
  search,
}: {
  projectId: string;
  statusId?: string;
  priority?: IssuePriority;
  assigneeId?: string;
  search?: string;
}) {
  return await prisma.issue.findMany({
    where: {
      projectId,
      deletedAt: null,
      ...(statusId ? { statusId } : {}),
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      status: true,
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      project: {
        select: {
          key: true,
          slug: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getIssueByKey({
  workspaceSlug,
  projectKey,
  number,
}: {
  workspaceSlug: string;
  projectKey: string;
  number: number;
}) {
  return await prisma.issue.findFirst({
    where: {
      number,
      deletedAt: null,
      project: {
        key: projectKey.toUpperCase(),
        workspace: {
          slug: workspaceSlug.toLowerCase(),
        },
      },
    },
    include: {
      project: {
        include: {
          workspace: true,
          statuses: {
            where: { deletedAt: null },
            orderBy: { position: "asc" },
          },
        },
      },
      status: true,
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      comments: {
        where: { deletedAt: null },
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
        orderBy: { createdAt: "asc" },
      },
      activity: {
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function moveIssue({
  issueId,
  targetStatusId,
  previousSortOrder,
  nextSortOrder,
  userId,
}: {
  issueId: string;
  targetStatusId: string;
  previousSortOrder?: number;
  nextSortOrder?: number;
  userId: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.issue.findUnique({
      where: { id: issueId },
      include: { status: true },
    });

    if (!existing) {
      throw new Error("Issue not found");
    }

    // Midpoint sortOrder calculation
    let calculatedSortOrder: number;
    if (previousSortOrder !== undefined && nextSortOrder !== undefined) {
      calculatedSortOrder = (previousSortOrder + nextSortOrder) / 2;
    } else if (previousSortOrder !== undefined) {
      calculatedSortOrder = previousSortOrder + 1000;
    } else if (nextSortOrder !== undefined) {
      calculatedSortOrder = nextSortOrder / 2;
    } else {
      calculatedSortOrder = 1000;
    }

    const updated = await tx.issue.update({
      where: { id: issueId },
      data: {
        statusId: targetStatusId,
        sortOrder: calculatedSortOrder,
      },
      include: {
        status: true,
      },
    });

    // Log Activity if status changed
    if (existing.statusId !== targetStatusId) {
      await tx.activity.create({
        data: {
          issueId,
          actorId: userId,
          type: ActivityType.STATUS_CHANGED,
          payload: {
            fromStatus: existing.status.name,
            toStatus: updated.status.name,
          } as Prisma.JsonObject,
        },
      });
    }

    return updated;
  });
}

export async function softDeleteIssue(issueId: string) {
  return await prisma.issue.update({
    where: { id: issueId },
    data: { deletedAt: new Date() },
  });
}
