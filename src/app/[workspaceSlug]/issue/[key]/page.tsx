import { notFound } from "next/navigation";
import { getIssueByKey } from "@/lib/api/issues";
import IssueDetailStandaloneClient from "./issue-client";

interface IssueDetailPageProps {
  params: Promise<{
    workspaceSlug: string;
    key: string;
  }>;
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { workspaceSlug, key } = await params;

  // Key is formatted as PROJECTKEY-101
  const parts = key.split("-");
  if (parts.length < 2) {
    notFound();
  }

  const projectKey = parts[0];
  const num = parseInt(parts[1], 10);
  if (isNaN(num)) {
    notFound();
  }

  const issue = await getIssueByKey({
    workspaceSlug,
    projectKey,
    number: num,
  });

  if (!issue) {
    notFound();
  }

  return (
    <IssueDetailStandaloneClient
      issue={issue}
      workspaceSlug={workspaceSlug}
    />
  );
}
