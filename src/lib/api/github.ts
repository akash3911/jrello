import crypto from "crypto";
import { prisma } from "@/lib/db";
import { ActivityType, Prisma } from "@prisma/client";

/**
 * Verify inbound GitHub webhook signature using timing-safe HMAC-SHA256 comparison
 */
export function verifyGitHubWebhookSignature(
  rawPayload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const expectedSignature = parts[1];
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawPayload);
  const calculatedSignature = hmac.digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, "utf-8"),
      Buffer.from(expectedSignature, "utf-8")
    );
  } catch {
    return false;
  }
}

/**
 * Deduplicate GitHub webhook delivery using GitHubDelivery table
 */
export async function isDeliveryProcessed(deliveryId: string, eventType: string): Promise<boolean> {
  const existing = await prisma.gitHubDelivery.findUnique({
    where: { deliveryId },
  });

  if (existing) {
    return true;
  }

  await prisma.gitHubDelivery.create({
    data: {
      deliveryId,
      eventType,
    },
  });

  return false;
}

/**
 * Link a GitHub repository as primary repo for a project
 */
export async function linkProjectRepo(projectId: string, githubRepoId: string) {
  return await prisma.gitHubRepo.update({
    where: { id: githubRepoId },
    data: { projectId },
  });
}

/**
 * Unlink primary GitHub repository from a project
 */
export async function unlinkProjectRepo(githubRepoId: string) {
  return await prisma.gitHubRepo.update({
    where: { id: githubRepoId },
    data: { projectId: null },
  });
}

/**
 * List all available GitHub repositories for a workspace
 */
export async function listWorkspaceGitHubRepos(workspaceId: string) {
  return await prisma.gitHubRepo.findMany({
    where: {
      installation: {
        workspaceId,
      },
    },
    include: {
      project: true,
      installation: true,
    },
    orderBy: { fullName: "asc" },
  });
}

/**
 * Extract Issue Key from branch name or PR title (e.g. "feat/JREL-101-auth" or "[CORE-42] add login")
 */
export function extractIssueKey(text: string): { projectKey: string; issueNumber: number } | null {
  const match = text.match(/([A-Z]{2,10})-(\d+)/i);
  if (!match) return null;
  return {
    projectKey: match[1].toUpperCase(),
    issueNumber: parseInt(match[2], 10),
  };
}

/**
 * Associate a Git branch with an Issue
 */
export async function recordIssueBranch({
  issueId,
  repoId,
  branchName,
  headSha,
}: {
  issueId: string;
  repoId: string;
  branchName: string;
  headSha?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const branch = await tx.issueBranch.upsert({
      where: {
        repoId_name: {
          repoId,
          name: branchName,
        },
      },
      create: {
        issueId,
        repoId,
        name: branchName,
        headSha,
      },
      update: {
        issueId,
        headSha,
      },
    });

    await tx.activity.create({
      data: {
        issueId,
        type: ActivityType.BRANCH_CREATED,
        payload: {
          branchName,
          headSha: headSha?.slice(0, 7),
        } as Prisma.JsonObject,
      },
    });

    return branch;
  });
}

/**
 * Associate a GitHub Pull Request with an Issue
 */
export async function recordIssuePullRequest({
  issueId,
  repoId,
  number,
  title,
  state,
  merged,
  url,
  headSha,
}: {
  issueId: string;
  repoId: string;
  number: number;
  title: string;
  state: string;
  merged: boolean;
  url: string;
  headSha?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const pr = await tx.issuePullRequest.upsert({
      where: {
        repoId_number: {
          repoId,
          number,
        },
      },
      create: {
        issueId,
        repoId,
        number,
        title,
        state,
        merged,
        url,
        headSha,
      },
      update: {
        title,
        state,
        merged,
        headSha,
      },
      include: { checks: true },
    });

    await tx.activity.create({
      data: {
        issueId,
        type: merged ? ActivityType.PR_MERGED : ActivityType.PR_OPENED,
        payload: {
          prNumber: number,
          title,
          url,
          merged,
        } as Prisma.JsonObject,
      },
    });

    return pr;
  });
}

/**
 * Update CI check runs for a Pull Request
 */
export async function recordIssueCheck({
  pullRequestId,
  name,
  status,
  conclusion,
  detailsUrl,
}: {
  pullRequestId: string;
  name: string;
  status: string;
  conclusion?: string | null;
  detailsUrl?: string | null;
}) {
  return await prisma.issueCheck.create({
    data: {
      pullRequestId,
      name,
      status,
      conclusion: conclusion || null,
      detailsUrl: detailsUrl || null,
      completedAt: status === "completed" ? new Date() : null,
    },
  });
}
