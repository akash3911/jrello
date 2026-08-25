"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PresenceViewer,
} from "./events";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UseProjectRealtimeOptions {
  projectId: string;
  currentUser: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
  } | null;
  onIssueCreated?: (issue: {
    id: string;
    number: number;
    title: string;
    statusKind: string;
    priority: string;
    sortOrder: number;
  }) => void;
  onIssueMoved?: (data: {
    issueId: string;
    fromStatus: string;
    toStatus: string;
    actorName: string;
  }) => void;
  onIssueUpdated?: () => void;
  onIssueDeleted?: (issueId: string) => void;
}

const PRESENCE_COLORS = [
  "#5b5bd6",
  "#0d8a94",
  "#e06616",
  "#9040d8",
  "#189a53",
  "#d43c3c",
];

export function useProjectRealtime({
  projectId,
  currentUser,
  onIssueCreated,
  onIssueMoved,
  onIssueUpdated,
  onIssueDeleted,
}: UseProjectRealtimeOptions) {
  const socketRef = React.useRef<TypedSocket | null>(null);
  const [viewers, setViewers] = React.useState<PresenceViewer[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!projectId) return;

    // Keep the latest callbacks without re-connecting on every render
    const cbRef = {
      current: { onIssueCreated, onIssueMoved, onIssueUpdated, onIssueDeleted },
    };
    cbRef.current = { onIssueCreated, onIssueMoved, onIssueUpdated, onIssueDeleted };

    const viewer: PresenceViewer = {
      id: currentUser?.id || `anon-${Math.random().toString(36).slice(2)}`,
      name: currentUser?.name || "Guest",
      avatarUrl: currentUser?.avatarUrl ?? null,
      color: PRESENCE_COLORS[0],
      initials: (currentUser?.name || "?").slice(0, 2).toUpperCase(),
    };

    const s: TypedSocket = io(window.location.origin, {
      path: "/api/socket",
      autoConnect: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
      timeout: 4000,
    });
    socketRef.current = s;

    const colorFor = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
      return PRESENCE_COLORS[hash % PRESENCE_COLORS.length];
    };

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("project:join", { projectId, user: viewer });
    });

    s.on("disconnect", () => setIsConnected(false));

    s.on("presence:update", (data) => {
      if (data.projectId !== projectId) return;
      setViewers(
        data.viewers.map((v) => ({
          ...v,
          color: v.id === viewer.id ? viewer.color : colorFor(v.id),
        }))
      );
    });

    s.on("issue:created", (data) => {
      if (data.projectId !== projectId) return;
      cbRef.current.onIssueCreated?.(data.issue);
      setAnnouncement(`New issue ${data.issue.title.slice(0, 40)} created`);
    });

    s.on("issue:moved", (data) => {
      if (data.projectId !== projectId) return;
      cbRef.current.onIssueMoved?.(data);
      setAnnouncement(`${data.actorName} moved an issue`);
    });

    s.on("issue:updated", (data) => {
      if (data.projectId !== projectId) return;
      cbRef.current.onIssueUpdated?.();
    });

    s.on("issue:deleted", (data) => {
      if (data.projectId !== projectId) return;
      cbRef.current.onIssueDeleted?.(data.issueId);
    });

    return () => {
      s.emit("project:leave", { projectId, userId: viewer.id });
      s.disconnect();
      socketRef.current = null;
    };
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { viewers, isConnected, announcement };
}
