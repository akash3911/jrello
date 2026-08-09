import { NextRequest, NextResponse } from "next/server";
import {
  verifyGitHubWebhookSignature,
  isDeliveryProcessed,
  extractIssueKey,
  recordIssuePullRequest,
  recordIssueBranch,
  recordIssueCheck,
} from "@/lib/api/github";
import { triggerIssueAutomation } from "@/lib/api/automation";
import { prisma } from "@/lib/db";

interface GitHubWebhookPayload {
  repository?: {
    full_name: string;
  };
  pull_request?: {
    number: number;
    title: string;
    state: string;
    merged?: boolean;
    html_url: string;
    head: {
      ref: string;
      sha: string;
    };
  };
  ref?: string;
  after?: string;
  check_run?: {
    name: string;
    status: string;
    conclusion?: string | null;
    html_url?: string | null;
    head_sha: string;
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-hub-signature-256");
  const deliveryId = req.headers.get("x-github-delivery");
  const event = req.headers.get("x-github-event");
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || "development_github_secret";

  if (!deliveryId) {
    return NextResponse.json({ error: "Missing X-GitHub-Delivery" }, { status: 400 });
  }

  // Raw body for signature validation
  const rawBody = await req.text();

  // Signature validation (bypassed only in local dev if no secret configured)
  if (process.env.NODE_ENV === "production") {
    const isValid = verifyGitHubWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Idempotency check
  const alreadyProcessed = await isDeliveryProcessed(deliveryId, event || "unknown");
  if (alreadyProcessed) {
    return NextResponse.json({ status: "already_processed", deliveryId }, { status: 200 });
  }

  let payload: GitHubWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GitHubWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // 1. Pull Request Event
  if (event === "pull_request" && payload.pull_request && payload.repository) {
    const pr = payload.pull_request;
    const repoFullName = payload.repository.full_name;

    const repo = await prisma.gitHubRepo.findFirst({
      where: { fullName: repoFullName },
    });

    if (repo) {
      const issueKey = extractIssueKey(pr.head.ref) || extractIssueKey(pr.title);

      if (issueKey && repo.projectId) {
        const issue = await prisma.issue.findFirst({
          where: {
            projectId: repo.projectId,
            number: issueKey.issueNumber,
          },
        });

        if (issue) {
          await recordIssuePullRequest({
            issueId: issue.id,
            repoId: repo.id,
            number: pr.number,
            title: pr.title,
            state: pr.state,
            merged: !!pr.merged,
            url: pr.html_url,
            headSha: pr.head.sha,
          });

          // Trigger Automation: PR Merged -> Done, PR Opened -> In Review
          if (pr.merged) {
            await triggerIssueAutomation({
              issueId: issue.id,
              event: "PR_MERGED",
              metadata: { prNumber: pr.number, prTitle: pr.title },
            });
          } else if (pr.state === "open") {
            await triggerIssueAutomation({
              issueId: issue.id,
              event: "PR_OPENED",
              metadata: { prNumber: pr.number, prTitle: pr.title },
            });
          }
        }
      }
    }
  }

  // 2. Push / Branch Event
  if (event === "push" && payload.ref && payload.repository) {
    const branchName = payload.ref.replace("refs/heads/", "");
    const repoFullName = payload.repository.full_name;

    const repo = await prisma.gitHubRepo.findFirst({
      where: { fullName: repoFullName },
    });

    if (repo && repo.projectId) {
      const issueKey = extractIssueKey(branchName);

      if (issueKey) {
        const issue = await prisma.issue.findFirst({
          where: {
            projectId: repo.projectId,
            number: issueKey.issueNumber,
          },
        });

        if (issue) {
          await recordIssueBranch({
            issueId: issue.id,
            repoId: repo.id,
            branchName,
            headSha: payload.after,
          });

          // Trigger Automation: Branch Created -> In Progress
          await triggerIssueAutomation({
            issueId: issue.id,
            event: "BRANCH_CREATED",
            metadata: { branchName },
          });
        }
      }
    }
  }

  // 3. CI Check Run Event
  if (event === "check_run" && payload.check_run) {
    const check = payload.check_run;
    const headSha = check.head_sha;

    const pr = await prisma.issuePullRequest.findFirst({
      where: { headSha },
    });

    if (pr) {
      await recordIssueCheck({
        pullRequestId: pr.id,
        name: check.name,
        status: check.status,
        conclusion: check.conclusion,
        detailsUrl: check.html_url,
      });
    }
  }

  return NextResponse.json({ success: true, deliveryId, event }, { status: 200 });
}
