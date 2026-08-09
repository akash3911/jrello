import { prisma } from "@/lib/db";
import { ActivityType, IssueStatusKind, Prisma } from "@prisma/client";

export interface ProjectAutomationConfig {
  autoMoveOnBranch?: boolean;
  autoMoveOnPrOpen?: boolean;
  autoMoveOnPrMerge?: boolean;
}

/**
 * Handle automated issue status transitions triggered by Git events
 */
export async function triggerIssueAutomation({
  issueId,
  event,
  metadata,
}: {
  issueId: string;
  event: "BRANCH_CREATED" | "PR_OPENED" | "PR_MERGED";
  metadata: {
    branchName?: string;
    prNumber?: number;
    prTitle?: string;
  };
}) {
  return await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findUnique({
      where: { id: issueId },
      include: {
        status: true,
        project: {
          include: {
            statuses: {
              where: { deletedAt: null },
              orderBy: { position: "asc" },
            },
          },
        },
      },
    });

    if (!issue) return null;

    let targetKind: IssueStatusKind | null = null;
    let activitySummary = "";

    if (event === "BRANCH_CREATED") {
      targetKind = IssueStatusKind.IN_PROGRESS;
      activitySummary = `Auto-moved to In Progress on branch "${metadata.branchName}" creation`;
    } else if (event === "PR_OPENED") {
      targetKind = IssueStatusKind.IN_REVIEW;
      activitySummary = `Auto-moved to In Review on PR #${metadata.prNumber} opened`;
    } else if (event === "PR_MERGED") {
      targetKind = IssueStatusKind.DONE;
      activitySummary = `Auto-moved to Done on PR #${metadata.prNumber} merged to main`;
    }

    if (!targetKind) return null;

    // Find the target status column in this project
    const targetStatus = issue.project.statuses.find((s) => s.kind === targetKind);
    if (!targetStatus || issue.statusId === targetStatus.id) {
      return null;
    }

    // Update issue status
    const updated = await tx.issue.update({
      where: { id: issueId },
      data: {
        statusId: targetStatus.id,
      },
    });

    // Record Bot-attributed activity record
    await tx.activity.create({
      data: {
        issueId,
        actorId: null, // System / Bot
        type: ActivityType.STATUS_CHANGED,
        payload: {
          fromStatus: issue.status.name,
          toStatus: targetStatus.name,
          reason: "AUTOMATION_RULE",
          summary: activitySummary,
          isAutomation: true,
        } as Prisma.JsonObject,
      },
    });

    return updated;
  });
}
