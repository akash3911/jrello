/**
 * Jrello Real-time Socket.IO Event Contract
 * All events are typed end-to-end per docs/REALTIME.md
 */

import { StatusKind } from "@/components/ui/status-badge";
import { PriorityLevel } from "@/components/ui/priority-badge";

export interface PresenceViewer {
  id: string;
  name: string;
  avatarUrl: string | null;
  color: string;
  initials: string;
}

export interface IssuePayload {
  id: string;
  number: number;
  title: string;
  description?: string | null;
  statusId: string;
  statusKind: StatusKind;
  priority: PriorityLevel;
  sortOrder: number;
  estimate?: number | null;
  assigneeId?: string | null;
  updatedAt: string;
}

export interface FieldDiff {
  field: string;
  from: unknown;
  to: unknown;
}

export interface ServerToClientEvents {
  "presence:update": (data: { projectId: string; viewers: PresenceViewer[] }) => void;
  "issue:created": (data: { issue: IssuePayload; projectId: string }) => void;
  "issue:updated": (data: { issue: IssuePayload; changes: FieldDiff[]; projectId: string }) => void;
  "issue:moved": (data: {
    issueId: string;
    fromStatus: StatusKind;
    toStatus: StatusKind;
    sortOrder: number;
    actorName: string;
    projectId: string;
  }) => void;
  "issue:deleted": (data: { issueId: string; projectId: string }) => void;
  "issue:assigned": (data: { issueId: string; assigneeId: string | null; actorId: string }) => void;
  "comment:created": (data: { comment: { id: string; issueId: string; body: string; userName: string } }) => void;
  "sprint:updated": (data: { sprintId: string; state: string; projectId: string }) => void;
  "notification:new": (data: { id: string; text: string }) => void;
}

export interface ClientToServerEvents {
  "project:join": (data: { projectId: string; user: PresenceViewer }) => void;
  "project:leave": (data: { projectId: string; userId: string }) => void;
  "cursor:move": (data: { projectId: string; x: number; y: number }) => void;
}
