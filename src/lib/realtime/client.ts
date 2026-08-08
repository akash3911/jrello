"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import {
  type ServerToClientEvents,
  type ClientToServerEvents,
  type PresenceViewer,
  type IssuePayload,
} from "./events";
import { type StatusKind } from "@/components/ui/status-badge";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UseProjectRealtimeOptions {
  projectId: string;
  currentUser?: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
  } | null;
  onIssueCreated?: (issue: IssuePayload) => void;
  onIssueMoved?: (data: {
    issueId: string;
    fromStatus: StatusKind;
    toStatus: StatusKind;
    actorName: string;
  }) => void;
  onIssueDeleted?: (issueId: string) => void;
  onRefetchNeeded?: () => void;
}

export function useProjectRealtime({
  projectId,
  currentUser,
  onIssueCreated,
  onIssueMoved,
  onIssueDeleted,
  onRefetchNeeded,
}: UseProjectRealtimeOptions) {
  const socketRef = React.useRef<TypedSocket | null>(null);
  const [viewers, setViewers] = React.useState<PresenceViewer[]>(() => [
    {
      id: currentUser?.id || "anon",
      name: currentUser?.name || "You",
      avatarUrl: currentUser?.avatarUrl || null,
      color: "var(--accent)",
      initials: (currentUser?.name || "ME").slice(0, 2).toUpperCase(),
    },
    {
      id: "usr-sarah",
      name: "Sarah Chen",
      avatarUrl: null,
      color: "#22c55e",
      initials: "SC",
    },
    {
      id: "usr-alex",
      name: "Alex Mercer",
      avatarUrl: null,
      color: "#f59e0b",
      initials: "AM",
    },
  ]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastLiveMessage, setLastLiveMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const currentViewer: PresenceViewer = {
      id: currentUser?.id || "anon",
      name: currentUser?.name || "You",
      avatarUrl: currentUser?.avatarUrl || null,
      color: "var(--accent)",
      initials: (currentUser?.name || "ME").slice(0, 2).toUpperCase(),
    };

    const socketUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    const s: TypedSocket = io(socketUrl, {
      path: "/api/socket",
      autoConnect: false,
      reconnectionAttempts: 5,
      timeout: 3000,
    });

    socketRef.current = s;

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("project:join", { projectId, user: currentViewer });
      if (onRefetchNeeded) {
        onRefetchNeeded();
      }
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on("presence:update", (data) => {
      if (data.projectId === projectId) {
        setViewers(data.viewers);
      }
    });

    s.on("issue:created", (data) => {
      if (data.projectId === projectId && onIssueCreated) {
        onIssueCreated(data.issue);
        setLastLiveMessage(`New issue #${data.issue.number} created`);
      }
    });

    s.on("issue:moved", (data) => {
      if (data.projectId === projectId && onIssueMoved) {
        onIssueMoved(data);
        setLastLiveMessage(`${data.actorName} moved issue to ${data.toStatus}`);
      }
    });

    s.on("issue:deleted", (data) => {
      if (data.projectId === projectId && onIssueDeleted) {
        onIssueDeleted(data.issueId);
      }
    });

    return () => {
      s.emit("project:leave", { projectId, userId: currentViewer.id });
      s.disconnect();
      socketRef.current = null;
    };
  }, [projectId, currentUser, onIssueCreated, onIssueMoved, onIssueDeleted, onRefetchNeeded]);

  return {
    viewers,
    isConnected,
    lastLiveMessage,
  };
}
