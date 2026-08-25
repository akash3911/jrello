import "server-only";
import { prisma } from "@/lib/db";
import {
  IssuePriority,
  ActivityType,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { emitToProject } from "@/lib/realtime/server";

const issueCardInclude = {
  status: true,
  assignee: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  labels: { include: { label: true } },
  _count: { select: { comments: { where: { deletedAt: null } } } },
} satisfies Prisma.IssueInclude;

export type IssueWithRelations = Prisma.IssueGetPayload<{
  include: typeof issueCardInclude;
}>;

export interface CreateIssueParams {
  projectId: string;
  title: string;
  description?: string | null;
  statusId?: string;
  statusKind?: string;
  priority?: IssuePriority;
  estimate?: number | null;
  assigneeId?: string | null;
  labelIds?: string[];
  sprintId?: string | null;
  userId: string;
}

async function resolveStatus(
  tx: Prisma.TransactionClient,
  projectId: string,
  statusId?: string,
  statusKind?: string
): Promise<{ id: string; name: string; kind: string }> {
  if (statusId) {
    const status = await tx.issueStatus.findFirst({
      where: { id: statusId, projectId, deletedAt: null },
    });
    if (!status) throw new Error("Status does not belong to this project");
    return { id: status.id, name: status.name, kind: status.kind };
  }

  if (statusKind) {
    const byKind = await tx.issueStatus.findFirst({
      where: { projectId, kind: statusKind as never, deletedAt: null },
      orderBy: { position: "asc" },
    });
    if (byKind) return { id: byKind.id, name: byKind.name, kind: byKind.kind };
  }

  const defaultStatus = await tx.issueStatus.findFirst({
    where: { projectId, deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { position: "asc" }],
  });
  if (!defaultStatus) throw new Error("Project has no configured statuses");
  return { id: defaultStatus.id, name: defaultStatus.name, kind: defaultStatus.kind };
}

export async function createIssue({
  projectId,
  title,
  description,
  statusId,
  statusKind,
  priority = IssuePriority.NONE,
  estimate,
  assigneeId,
  labelIds = [],
  sprintId,
  userId,
}: CreateIssueParams): Promise<IssueWithRelations> {
  return prisma.$transaction(
    async (tx) => {
      const status = await resolveStatus(tx, projectId, statusId, statusKind);

      const highestIssue = await tx.issue.findFirst({
        where: { projectId },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      const nextNumber = (highestIssue?.number ?? 100) + 1;

      const lastInColumn = await tx.issue.findFirst({
        where: { projectId, statusId: status.id, deletedAt: null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const nextSortOrder = (lastInColumn?.sortOrder ?? 0) + 1000;

      const issue = await tx.issue.create({
        data: {
          projectId,
          number: nextNumber,
          title: title.trim(),
          description: description?.trim() || null,
          statusId: status.id,
          priority,
          sortOrder: nextSortOrder,
          estimate: estimate ?? null,
          assigneeId: assigneeId || null,
          sprintId: sprintId || null,
          createdById: userId,
          ...(labelIds.length > 0
            ? { labels: { create: labelIds.map((labelId) => ({ labelId })) } }
            : {}),
        },
        include: issueCardInclude,
      });

      await tx.activity.create({
        data: {
          issueId: issue.id,
          actorId: userId,
          type: ActivityType.ISSUE_CREATED,
          payload: {
            number: nextNumber,
            title: issue.title,
            statusName: status.name,
          } as Prisma.JsonObject,
        },
      });

      // Notify the assignee when someone else assigns them at creation time.
      if (assigneeId && assigneeId !== userId) {
        const project = await tx.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { workspaceId: true },
        });
        await tx.notification.create({
          data: {
            userId: assigneeId,
            workspaceId: project.workspaceId,
            type: NotificationType.ASSIGNED,
            issueId: issue.id,
            actorId: userId,
          },
        });
      }

      emitToProject(projectId, "issue:created", {
        projectId,
        issue: serializeIssuePayload(issue),
      });

      return issue;
    },
    { isolationLevel: "Serializable", timeout: 15_000 }
  );
}

export interface ListIssuesFilters {
  projectId: string;
  sprintId?: string | null;
  unassignedOnly?: boolean;
  statusId?: string;
  priority?: IssuePriority;
  assigneeId?: string;
  search?: string;
}

export async function listProjectIssues({
  projectId,
  sprintId,
  statusId,
  priority,
  assigneeId,
  search,
}: ListIssuesFilters) {
  return prisma.issue.findMany({
    where: {
      projectId,
      deletedAt: null,
      ...(sprintId === undefined ? {} : { sprintId }),
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
    include: issueCardInclude,
    orderBy: { sortOrder: "asc" },
  });
}

export async function getIssueByKey({
  workspaceSlug,
  projectKey,
  number,
}: {
  workspaceSlug: string;
  /** Project key OR project slug. */
  projectKey: string;
  number: number;
}) {
  return prisma.issue.findFirst({
    where: {
      number,
      deletedAt: null,
      project: {
        OR: [{ key: projectKey.toUpperCase() }, { slug: projectKey.toLowerCase() }],
        workspace: { slug: workspaceSlug.toLowerCase() },
      },
    },
    include: {
      project: {
        include: {
          statuses: { where: { deletedAt: null }, orderBy: { position: "asc" } },
        },
      },
      status: true,
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      labels: { include: { label: true } },
      comments: {
        where: { deletedAt: null },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      activity: {
        include: {
          actor: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function updateIssueDetails({
  issueId,
  userId,
  changes,
}: {
  issueId: string;
  userId: string;
  changes: {
    title?: string;
    description?: string | null;
    statusId?: string;
    priority?: IssuePriority;
    estimate?: number | null;
    assigneeId?: string | null;
  };
}): Promise<IssueWithRelations & { projectId: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.issue.findUnique({
      where: { id: issueId },
      include: { status: true, assignee: true },
    });
    if (!existing || existing.deletedAt) throw new Error("Issue not found");

    let resolvedStatusId = existing.statusId;
    let newStatusName: string | null = null;
    if (changes.statusId && changes.statusId !== existing.statusId) {
      const status = await resolveStatus(tx, existing.projectId, changes.statusId);
      resolvedStatusId = status.id;
      newStatusName = status.name;
    }

    const updated = await tx.issue.update({
      where: { id: issueId },
      data: {
        title: changes.title !== undefined ? changes.title.trim() : undefined,
        description:
          changes.description !== undefined
            ? changes.description?.trim() || null
            : undefined,
        statusId: resolvedStatusId,
        priority: changes.priority,
        estimate: changes.estimate !== undefined ? changes.estimate : undefined,
        assigneeId:
          changes.assigneeId !== undefined ? changes.assigneeId || null : undefined,
      },
      include: { ...issueCardInclude, assignee: true },
    });

    const logs: Prisma.ActivityCreateManyInput[] = [];
    if (newStatusName) {
      logs.push({
        issueId,
        actorId: userId,
        type: ActivityType.STATUS_CHANGED,
        payload: {
          fromStatus: existing.status.name,
          toStatus: newStatusName,
        } as Prisma.JsonObject,
      });
    }
    if (changes.priority && changes.priority !== existing.priority) {
      logs.push({
        issueId,
        actorId: userId,
        type: ActivityType.PRIORITY_CHANGED,
        payload: { from: existing.priority, to: changes.priority } as Prisma.JsonObject,
      });
    }
    if (changes.title !== undefined && changes.title.trim() !== existing.title) {
      logs.push({
        issueId,
        actorId: userId,
        type: ActivityType.TITLE_CHANGED,
        payload: { from: existing.title, to: changes.title.trim() } as Prisma.JsonObject,
      });
    }
    if (
      changes.assigneeId !== undefined &&
      (changes.assigneeId || null) !== existing.assigneeId
    ) {
      logs.push({
        issueId,
        actorId: userId,
        type: ActivityType.ASSIGNEE_CHANGED,
        payload: { from: existing.assignee?.name ?? null } as Prisma.JsonObject,
      });

      if (changes.assigneeId && changes.assigneeId !== userId) {
        const project = await tx.project.findUniqueOrThrow({
          where: { id: existing.projectId },
          select: { workspaceId: true },
        });
        await tx.notification.create({
          data: {
            userId: changes.assigneeId,
            workspaceId: project.workspaceId,
            type: NotificationType.ASSIGNED,
            issueId,
            actorId: userId,
          },
        });
      }
    }
    if (logs.length > 0) {
      await tx.activity.createMany({ data: logs });
    }

    emitToProject(existing.projectId, "issue:updated", {
      projectId: existing.projectId,
      issue: serializeIssuePayload(updated),
      changes: Object.keys(changes).map((field) => ({ field })),
    });

    return updated as IssueWithRelations & { projectId: string };
  });
}

/**
 * Move an issue between columns / positions.
 * Sort order uses fractional midpoint indexing so drops between two cards
 * converge without renumbering siblings.
 */
export async function moveIssue({
  issueId,
  targetStatusId,
  previousSortOrder,
  nextSortOrder,
  userId,
  actorName,
}: {
  issueId: string;
  targetStatusId: string;
  previousSortOrder?: number;
  nextSortOrder?: number;
  userId: string;
  actorName?: string | null;
}): Promise<IssueWithRelations & { projectId: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.issue.findUnique({
      where: { id: issueId },
      include: { status: true },
    });
    if (!existing || existing.deletedAt) throw new Error("Issue not found");

    const targetStatus = await tx.issueStatus.findFirst({
      where: { id: targetStatusId, projectId: existing.projectId, deletedAt: null },
    });
    if (!targetStatus) throw new Error("Target column does not belong to this project");

    let sortOrder: number;
    if (previousSortOrder !== undefined && nextSortOrder !== undefined) {
      sortOrder = (previousSortOrder + nextSortOrder) / 2;
    } else if (previousSortOrder !== undefined) {
      sortOrder = previousSortOrder + 1000;
    } else if (nextSortOrder !== undefined) {
      sortOrder = nextSortOrder / 2;
    } else {
      const lastInColumn = await tx.issue.findFirst({
        where: {
          projectId: existing.projectId,
          statusId: targetStatusId,
          deletedAt: null,
          NOT: { id: issueId },
        },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (lastInColumn?.sortOrder ?? 0) + 1000;
    }

    const updated = await tx.issue.update({
      where: { id: issueId },
      data: { statusId: targetStatusId, sortOrder },
      include: issueCardInclude,
    });

    if (existing.statusId !== targetStatusId) {
      await tx.activity.create({
        data: {
          issueId,
          actorId: userId,
          type: ActivityType.STATUS_CHANGED,
          payload: {
            fromStatus: existing.status.name,
            toStatus: targetStatus.name,
          } as Prisma.JsonObject,
        },
      });
    }

    emitToProject(existing.projectId, "issue:moved", {
      projectId: existing.projectId,
      issueId,
      fromStatus: existing.status.kind,
      toStatus: targetStatus.kind,
      sortOrder,
      actorName: actorName ?? "Someone",
    });

    return updated as IssueWithRelations & { projectId: string };
  });
}

export async function softDeleteIssue(issueId: string) {
  const deleted = await prisma.$transaction(async (tx) => {
    const existing = await tx.issue.findUnique({
      where: { id: issueId },
      select: { projectId: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw new Error("Issue not found");

    const issue = await tx.issue.update({
      where: { id: issueId },
      data: { deletedAt: new Date() },
    });

    await tx.activity.create({
      data: {
        issueId,
        type: ActivityType.ISSUE_DELETED,
        payload: { number: issue.number, title: issue.title } as Prisma.JsonObject,
      },
    });

    return issue;
  });

  emitToProject(deleted.projectId, "issue:deleted", {
    projectId: deleted.projectId,
    issueId,
  });

  return deleted;
}

export async function addComment({
  issueId,
  userId,
  body,
}: {
  issueId: string;
  userId: string;
  body: string;
}) {
  return prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findUnique({
      where: { id: issueId },
      include: { project: { select: { workspaceId: true } }, assignee: true },
    });
    if (!issue || issue.deletedAt) throw new Error("Issue not found");

    const comment = await tx.comment.create({
      data: { issueId, userId, body: body.trim() },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await tx.activity.create({
      data: {
        issueId,
        actorId: userId,
        type: ActivityType.COMMENT_ADDED,
        payload: { preview: body.slice(0, 120) } as Prisma.JsonObject,
      },
    });

    const notifyUserId =
      issue.assigneeId && issue.assigneeId !== userId ? issue.assigneeId : null;
    if (notifyUserId) {
      await tx.notification.create({
        data: {
          userId: notifyUserId,
          workspaceId: issue.project.workspaceId,
          type: NotificationType.COMMENTED,
          issueId,
          actorId: userId,
        },
      });
    }

    emitToProject(issue.projectId, "comment:created", {
      comment: {
        id: comment.id,
        issueId,
        body: comment.body,
        userName: comment.user.name ?? "Someone",
      },
    });

    return comment;
  });
}

/** Shape used by Socket.IO broadcasts. */
export function serializeIssuePayload(issue: IssueWithRelations) {
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    description: issue.description,
    statusId: issue.statusId,
    statusKind: issue.status.kind,
    priority: issue.priority,
    sortOrder: issue.sortOrder,
    estimate: issue.estimate,
    assigneeId: issue.assigneeId,
    updatedAt: (issue.updatedAt as Date).toISOString(),
  };
}
