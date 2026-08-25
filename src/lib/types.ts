import type { PriorityLevel } from "@/components/ui/priority-badge";
import type { StatusKind } from "@/components/ui/status-badge";

/** Client-safe shapes passed from Server Components to the interactive shell. */

export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export type WorkspaceRoleValue = "OWNER" | "ADMIN" | "MEMBER";

export interface ProjectSummaryClient {
  id: string;
  name: string;
  key: string;
  slug: string;
  description: string | null;
  issueCount: number;
}

export interface WorkspaceSummaryClient {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRoleValue;
  projectCount?: number;
}

export interface ProjectMemberClient {
  id: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  user: UserSummary;
}

export interface LabelClient {
  id: string;
  name: string;
  color: string;
}

export interface StatusColumnClient {
  id: string;
  name: string;
  kind: StatusKind;
  position: number;
  isDefault: boolean;
}

export interface IssueClient {
  id: string;
  number: number;
  title: string;
  description: string | null;
  statusId: string;
  statusKind: StatusKind;
  priority: PriorityLevel;
  sortOrder: number;
  estimate: number | null;
  sprintId: string | null;
  assignee: UserSummary | null;
  labels: { label: LabelClient }[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailClient {
  id: string;
  workspaceId: string;
  workspaceName: string;
  name: string;
  key: string;
  slug: string;
  description: string | null;
  statuses: StatusColumnClient[];
  members: ProjectMemberClient[];
  labels: LabelClient[];
}

export interface ShellContext {
  currentUser: UserSummary;
  workspaces: WorkspaceSummaryClient[];
  currentWorkspace: WorkspaceSummaryClient;
  projects: ProjectSummaryClient[];
}
