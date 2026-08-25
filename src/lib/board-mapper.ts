import type { BoardIssue } from "@/components/board/KanbanCard";
import type { StatusKind } from "@/components/ui/status-badge";
import type { PriorityLevel } from "@/components/ui/priority-badge";

/**
 * Map a raw Prisma issue (with status/assignee/labels/_count relations)
 * to the client-safe board card shape. Safe to import from both
 * Server and Client Components.
 */
export function mapIssue(
  raw: Record<string, unknown>,
  projectKey: string
): BoardIssue {
  const status = raw.status as { id: string; kind: StatusKind };
  const assignee = raw.assignee as
    | { id: string; name: string | null; avatarUrl: string | null }
    | null;
  const commentsCount =
    typeof raw._count === "object" && raw._count !== null
      ? ((raw._count as { comments: number }).comments ?? 0)
      : 0;
  const labelRows =
    (raw.labels as { label: { id: string; name: string; color: string } }[]) ?? [];

  return {
    id: raw.id as string,
    key: `${projectKey}-${raw.number as number}`,
    number: raw.number as number,
    title: raw.title as string,
    description: (raw.description as string | null) ?? null,
    statusId: status.id,
    statusKind: status.kind,
    priority: raw.priority as PriorityLevel,
    sortOrder: raw.sortOrder as number,
    estimate: (raw.estimate as number | null) ?? null,
    assignee,
    labels: labelRows,
    commentsCount,
  };
}
