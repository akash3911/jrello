import { prisma } from "@/lib/db";
import { SprintState, ActivityType, IssueStatusKind, Prisma } from "@prisma/client";

export interface CreateSprintParams {
  projectId: string;
  name: string;
  goal?: string | null;
  startDate: Date;
  endDate: Date;
  userId: string;
}

export async function createSprint({
  projectId,
  name,
  goal,
  startDate,
  endDate,
}: CreateSprintParams) {
  return await prisma.sprint.create({
    data: {
      projectId,
      name: name.trim(),
      goal: goal?.trim() || null,
      state: SprintState.PLANNED,
      startDate,
      endDate,
    },
    include: {
      issues: true,
    },
  });
}

export async function listProjectSprints(projectId: string) {
  return await prisma.sprint.findMany({
    where: { projectId },
    include: {
      issues: {
        where: { deletedAt: null },
        include: {
          status: true,
          assignee: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function startSprint(sprintId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const sprint = await tx.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    // Rule: Exactly ONE active sprint per project at a time
    const existingActive = await tx.sprint.findFirst({
      where: {
        projectId: sprint.projectId,
        state: SprintState.ACTIVE,
        id: { not: sprintId },
      },
    });

    if (existingActive) {
      throw new Error(
        `Sprint "${existingActive.name}" is currently active. Please complete it before starting a new sprint.`
      );
    }

    const updated = await tx.sprint.update({
      where: { id: sprintId },
      data: { state: SprintState.ACTIVE },
      include: { issues: true },
    });

    // Log Activity for sprint start
    const firstIssue = updated.issues[0];
    if (firstIssue) {
      await tx.activity.create({
        data: {
          issueId: firstIssue.id,
          actorId: userId,
          type: ActivityType.SPRINT_ISSUE_ADDED,
          payload: {
            sprintName: updated.name,
            action: "SPRINT_STARTED",
          } as Prisma.JsonObject,
        },
      });
    }

    return updated;
  });
}

export async function completeSprint({
  sprintId,
  incompleteAction,
  nextSprintId,
  userId,
}: {
  sprintId: string;
  incompleteAction: "backlog" | "next_sprint";
  nextSprintId?: string;
  userId: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const sprint = await tx.sprint.findUnique({
      where: { id: sprintId },
      include: {
        issues: {
          where: { deletedAt: null },
          include: { status: true },
        },
      },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    // Find incomplete issues (status is not DONE and not CANCELED)
    const incompleteIssues = sprint.issues.filter(
      (issue) =>
        issue.status.kind !== IssueStatusKind.DONE &&
        issue.status.kind !== IssueStatusKind.CANCELED
    );

    // Carry over incomplete issues
    if (incompleteIssues.length > 0) {
      const targetSprintId =
        incompleteAction === "next_sprint" && nextSprintId ? nextSprintId : null;

      for (const issue of incompleteIssues) {
        await tx.issue.update({
          where: { id: issue.id },
          data: { sprintId: targetSprintId },
        });

        await tx.activity.create({
          data: {
            issueId: issue.id,
            actorId: userId,
            type: ActivityType.SPRINT_ISSUE_REMOVED,
            payload: {
              sprintName: sprint.name,
              reason: "CARRY_OVER_ON_COMPLETION",
            } as Prisma.JsonObject,
          },
        });
      }
    }

    // Mark sprint as completed
    const completedSprint = await tx.sprint.update({
      where: { id: sprintId },
      data: { state: SprintState.COMPLETED },
    });

    return completedSprint;
  });
}

export async function assignIssueToSprint({
  issueId,
  sprintId,
  userId,
}: {
  issueId: string;
  sprintId: string | null;
  userId: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.issue.update({
      where: { id: issueId },
      data: { sprintId },
      include: { sprint: true, project: true },
    });

    await tx.activity.create({
      data: {
        issueId,
        actorId: userId,
        type: sprintId ? ActivityType.SPRINT_ISSUE_ADDED : ActivityType.SPRINT_ISSUE_REMOVED,
        payload: {
          sprintName: updated.sprint?.name || "Backlog",
        } as Prisma.JsonObject,
      },
    });

    return updated;
  });
}

export async function getSprintVelocityReport(projectId: string) {
  const completedSprints = await prisma.sprint.findMany({
    where: {
      projectId,
      state: SprintState.COMPLETED,
    },
    include: {
      issues: {
        include: { status: true },
      },
    },
    orderBy: { endDate: "desc" },
    take: 6,
  });

  const activeSprint = await prisma.sprint.findFirst({
    where: {
      projectId,
      state: SprintState.ACTIVE,
    },
    include: {
      issues: {
        where: { deletedAt: null },
        include: { status: true },
      },
    },
  });

  const velocityData = completedSprints.map((sp) => {
    const totalCommitted = sp.issues.reduce((sum, i) => sum + (i.estimate || 3), 0);
    const completedPoints = sp.issues
      .filter((i) => i.status.kind === IssueStatusKind.DONE)
      .reduce((sum, i) => sum + (i.estimate || 3), 0);

    return {
      sprintId: sp.id,
      name: sp.name,
      committedPoints: totalCommitted,
      completedPoints,
      carryOverPoints: totalCommitted - completedPoints,
      completionRate: totalCommitted > 0 ? Math.round((completedPoints / totalCommitted) * 100) : 100,
      startDate: sp.startDate,
      endDate: sp.endDate,
    };
  });

  const averageVelocity =
    velocityData.length > 0
      ? Math.round(
          velocityData.reduce((sum, v) => sum + v.completedPoints, 0) / velocityData.length
        )
      : 24;

  return {
    activeSprint,
    completedSprints: velocityData,
    averageVelocity,
  };
}
