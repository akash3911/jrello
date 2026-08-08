"use client";

import * as React from "react";
import { AppShell } from "@/components/shell/AppShell";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { type KanbanIssueItem } from "@/components/board/KanbanCard";
import { type PriorityLevel } from "@/components/ui/priority-badge";
import { type StatusKind } from "@/components/ui/status-badge";

export interface StatusData {
  id: string;
  projectId: string;
  name: string;
  kind: StatusKind;
  position: number;
  isDefault: boolean;
}

export interface IssueAssigneeData {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface IssueData {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: StatusData;
  priority: PriorityLevel;
  assignee: IssueAssigneeData | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  estimate: number | null;
}

export interface ProjectData {
  id: string;
  name: string;
  key: string;
  slug: string;
  description: string | null;
  statuses: StatusData[];
  issues: IssueData[];
}

export interface CurrentUserData {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface ProjectBoardClientProps {
  project: ProjectData;
  workspaceSlug: string;
  currentUser: CurrentUserData | null;
}

export default function ProjectBoardClient({
  project,
  workspaceSlug,
  currentUser,
}: ProjectBoardClientProps) {
  const initialIssues: KanbanIssueItem[] = React.useMemo(() => {
    return (project.issues || []).map((i) => ({
      id: i.id,
      key: `${project.key}-${i.number}`,
      title: i.title,
      description: i.description || "",
      status: i.status.kind,
      priority: i.priority,
      assignee: i.assignee
        ? {
            name: i.assignee.name || "User",
            avatar: i.assignee.avatarUrl,
            initials: (i.assignee.name || "U").slice(0, 2).toUpperCase(),
          }
        : { name: "Unassigned", initials: "UA" },
      labels: ["project"],
      branchName: `feat/${project.key.toLowerCase()}-${i.number}`,
      commentsCount: 0,
      createdAt: new Date(i.createdAt).toLocaleDateString(),
      updatedAt: new Date(i.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      estimate: i.estimate ? `${i.estimate} pts` : "3 pts",
    }));
  }, [project]);

  return (
    <AppShell>
      <KanbanBoard
        projectKey={project.key}
        projectName={project.name}
        projectDescription={project.description}
        workspaceSlug={workspaceSlug}
        initialStatuses={project.statuses}
        initialIssues={initialIssues}
        currentUser={currentUser}
      />
    </AppShell>
  );
}
