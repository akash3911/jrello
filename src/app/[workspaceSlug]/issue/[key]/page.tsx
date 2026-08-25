import { notFound } from "next/navigation";
import { getIssueByKey } from "@/lib/api/issues";
import IssueDetailClient from "./issue-client";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; key: string }>;
}) {
  const { workspaceSlug, key } = await params;

  // Key format: PROJECTKEY-123
  const match = key.match(/^([A-Za-z][A-Za-z0-9]*)-(\d+)$/);
  if (!match) notFound();

  const [, projectKey, numStr] = match;
  const number = Number.parseInt(numStr, 10);

  const issue = await getIssueByKey({
    workspaceSlug,
    projectKey,
    number,
  });
  if (!issue) notFound();

  return (
    <IssueDetailClient
      workspaceSlug={workspaceSlug}
      initialIssue={{
        id: issue.id,
        number: issue.number,
        title: issue.title,
        description: issue.description,
        status: {
          id: issue.status.id,
          name: issue.status.name,
          kind: issue.status.kind,
        },
        priority: issue.priority,
        estimate: issue.estimate,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
        assignee: issue.assignee
          ? {
              id: issue.assignee.id,
              name: issue.assignee.name,
              avatarUrl: issue.assignee.avatarUrl ?? null,
            }
          : null,
        createdBy: {
          id: issue.createdBy.id,
          name: issue.createdBy.name,
        },
        project: {
          key: issue.project.key,
          name: issue.project.name,
          slug: issue.project.slug,
          statuses: (issue.project.statuses ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            kind: s.kind,
          })),
        },
        labels: issue.labels.map(({ label }) => ({
          label: { id: label.id, name: label.name, color: label.color },
        })),
        comments: issue.comments.map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          user: {
            id: c.user.id,
            name: c.user.name,
            email: c.user.email,
            avatarUrl: c.user.avatarUrl ?? null,
          },
        })),
      }}
    />
  );
}
