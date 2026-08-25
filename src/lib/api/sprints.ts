import "server-only";
import { prisma } from "@/lib/db";
import {
  SprintState,
  ActivityType,
  IssueStatusKind,
  Prisma,
} from "@prisma/client";
import { emitToProject } from "@/lib/realtime/server";

export interface CreateSprintParams {
  projectId: string;
  name: string;
  goal?: string | null;
  startDate: Date;
  endDate: Date;
}

export function createSprint({
  projectId,
  name,
  goal,
  startDate,
  endDate,
}: CreateSprintParams) {
  return prisma.sprint.create({
    data: {
      projectId,
      name: name.trim(),
      goal: goal?.trim() || null,
      state: SprintState.PLANNED,
      startDate,
      endDate,
    },
    include: { _count: { select: { issues: true } } },
  });
}

export function listProjectSprints(projectId: string) {
  return prisma.sprint.findMany({
    where: { projectId },
    include: {
      issues: {
        where: { deletedAt: null },
        include: {
          status: true,
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ state: "asc" }, { createdAt: "desc" }],
  });
}

export async function startSprint(sprintId: string) {
  const sprint = await prisma.$transaction(async (tx) => {
    const target = await tx.sprint.findUnique({ where: { id: sprintId } });
    if (!target) throw new Error("Sprint not found");
    if (target.state === SprintState.ACTIVE) throw new Error("Sprint already active");

    // Exactly one active sprint per project
    const existingActive = await tx.sprint.findFirst({
      where: { projectId: target.projectId, state: SprintState.ACTIVE },
    });
    if (existingActive) {
      throw new Error(
        `"${existingActive.name}" is still active. Complete it before starting a new sprint.`
      );
    }

    const now = new Date();
    return tx.sprint.update({
      where: { id: sprintId },
      data: {
        state: SprintState.ACTIVE,
        startDate: target.startDate < now && target.state === SprintState.PLANNED ? target.startDate : now,
        endDate: target.endDate > now ? target.endDate : new Date(now.getTime() + 14 * 24 * 3600 * 1000),
      },
      include: { issues: { where: { deletedAt: null } } },
    });
  });

  emitToProject(sprint.projectId, "sprint:updated", {
    sprintId,
    state: SprintState.ACTIVE,
    projectId: sprint.projectId,
  });

  return sprint;
}

export async function completeSprint({
  sprintId,
  incompleteAction,
  nextSprintId,
}: {
  sprintId: string;
  incompleteAction: "backlog" | "next_sprint";
  nextSprintId?: string;
}) {
  const completed = await prisma.$transaction(async (tx) => {
    const sprint = await tx.sprint.findUnique({
      where: { id: sprintId },
      include: {
        issues: { where: { deletedAt: null }, include: { status: true } },
      },
    });
    if (!sprint) throw new Error("Sprint not found");
    if (sprint.state !== SprintState.ACTIVE)
      throw new Error("Only an active sprint can be completed");

    const incompleteIssues = sprint.issues.filter(
      (issue) =>
        issue.status.kind !== IssueStatusKind.DONE &&
        issue.status.kind !== IssueStatusKind.CANCELED
    );

    for (const issue of incompleteIssues) {
      let targetSprintId: string | null = null;

      if (incompleteAction === "next_sprint" && nextSprintId) {
        const nextSprint = await tx.sprint.findFirst({
          where: {
            id: nextSprintId,
            projectId: sprint.projectId,
            state: SprintState.PLANNED,
          },
        });
        if (!nextSprint)
          throw new Error("Next sprint must be a planned sprint of this project");
        targetSprintId = nextSprintId;
      }

      await tx.issue.update({
        where: { id: issue.id },
        data: { sprintId: targetSprintId },
      });

      await tx.activity.create({
        data: {
          issueId: issue.id,
          type: ActivityType.SPRINT_ISSUE_REMOVED,
          payload: {
            sprintName: sprint.name,
            reason: "CARRY_OVER_ON_COMPLETION",
          } as Prisma.JsonObject,
        },
      });
    }

    return tx.sprint.update({
      where: { id: sprintId },
      data: { state: SprintState.COMPLETED },
    });
  });

  emitToProject(completed.projectId, "sprint:updated", {
    sprintId,
    state: SprintState.COMPLETED,
    projectId: completed.projectId,
  });

  return completed;
}

export async function assignIssueToSprint({
  issueId,
  sprintId,
}: {
  issueId: string;
  sprintId: string | null;
}) {
  const updated = await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findUnique({
      where: { id: issueId },
      select: { id: true, projectId: true, deletedAt: true },
    });
    if (!issue || issue.deletedAt) throw new Error("Issue not found");

    if (sprintId) {
      const sprint = await tx.sprint.findFirst({
        where: { id: sprintId, projectId: issue.projectId },
      });
      if (!sprint)
        throw new Error("Sprint does not belong to this project");
      if (sprint.state === SprintState.COMPLETED)
        throw new Error("Cannot add issues to a completed sprint");
    }

    return tx.issue.update({
      where: { id: issueId },
      data: { sprintId },
      include: { status: true },
    });
  });

  emitToProject(updated.projectId, "sprint:updated", {
    sprintId: updated.sprintId ?? "__backlog__",
    state: "ISSUE_MOVED",
    projectId: updated.projectId,
  });

  return updated;
}

export async function getSprintVelocityReport(projectId: string) {
  const completedSprints = await prisma.sprint.findMany({
    where: { projectId, state: SprintState.COMPLETED },
    include: { issues: { include: { status: true } } },
    orderBy: { endDate: "desc" },
    take: 6,
  });

  const activeSprint = await prisma.sprint.findFirst({
    where: { projectId, state: SprintState.ACTIVE },
    include: {
      issues: {
        where: { deletedAt: null },
        include: { status: true },
      },
    },
  });

  const velocityData = [...completedSprints]
    .reverse()
    .map((sp) => {
      const committedPoints = sp.issues.reduce((sum, i) => sum + (i.estimate ?? 3), 0);
      const donePoints = sp.issues
        .filter((i) => i.status.kind === IssueStatusKind.DONE)
        .reduce((sum, i) => sum + (i.estimate ?? 3), 0);

      return {
        sprintId: sp.id,
        name: sp.name,
        startDate: sp.startDate.toISOString(),
        endDate: sp.endDate.toISOString(),
        totalIssues: sp.issues.length,
        completedPoints: donePoints,
        carryOverPoints: committedPoints - donePoints,
        committedPoints,
        completionRate:
          committedPoints > 0
            ? Math.round((donePoints / committedPoints) * 100)
            : 100,
      };
    });

  const averageVelocity =
    velocityData.length > 0
      ? Math.round(
          velocityData.reduce((sum, v) => sum + v.completedPoints, 0) /
            velocityData.length
        )
      : 0;

  const reliability =
    velocityData.length > 0
      ? Math.round(
          velocityData.reduce((sum, v) => sum + v.completionRate, 0) /
            velocityData.length
        )
      : 0;

  const activeSprintStats = activeSprint
    ? {
        id: activeSprint.id,
        name: activeSprint.name,
        totalIssues: activeSprint.issues.length,
        totalPoints: activeSprint.issues.reduce(
          (sum, i) => sum + (i.estimate ?? 3),
          0
        ),
        donePoints: activeSprint.issues
          .filter((i) => i.status.kind === IssueStatusKind.DONE)
          .reduce((sum, i) => sum + (i.estimate ?? 3), 0),
        endDate: activeSprint.endDate.toISOString(),
      }
    : null;

  return { velocity: velocityData, averageVelocity, reliability, activeSprintStats };
}
