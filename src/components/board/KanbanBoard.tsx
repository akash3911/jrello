"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { KanbanColumn } from "./KanbanColumn";
import { IssueDetailPanel } from "./IssueDetailPanel";
import { PresenceAvatars } from "./PresenceAvatars";
import { ToastStack, useToasts } from "./Toasts";
import { useProjectRealtime } from "@/lib/realtime/client";
import type { StatusKind } from "@/components/ui/status-badge";
import { mapIssue } from "@/lib/board-mapper";
import type { BoardIssue } from "./KanbanCard";
import type {
  StatusColumnClient,
  UserSummary,
  ProjectMemberClient,
} from "@/lib/types";

interface KanbanBoardProps {
  projectKey: string;
  projectName: string;
  projectId: string;
  projectSlug: string;
  workspaceSlug: string;
  statuses: StatusColumnClient[];
  initialIssues: BoardIssue[];
  members: ProjectMemberClient[];
  currentUser: UserSummary;
}

export function KanbanBoard({
  projectKey,
  projectName,
  projectId,
  projectSlug,
  workspaceSlug,
  statuses,
  initialIssues,
  members,
  currentUser,
}: KanbanBoardProps) {
  const router = useRouter();
  const { toasts, push } = useToasts();

  const [issues, setIssues] = React.useState<BoardIssue[]>(initialIssues);
  const [syncedInitial, setSyncedInitial] = React.useState(initialIssues);
  const [openIssueKey, setOpenIssueKey] = React.useState<string | null>(null);

  // Re-sync local state when the server sends fresh data (router.refresh)
  if (syncedInitial !== initialIssues) {
    setSyncedInitial(initialIssues);
    setIssues(initialIssues);
  }

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = React.useState("ALL");

  // DnD
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = React.useState<string | null>(null);

  // Keyboard focus
  const [focusCol, setFocusCol] = React.useState(0);
  const [focusRow, setFocusRow] = React.useState(0);

  const filteredIssues = React.useMemo(
    () =>
      issues.filter((issue) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          issue.title.toLowerCase().includes(q) ||
          issue.key.toLowerCase().includes(q);
        const matchesPriority =
          priorityFilter === "ALL" || issue.priority === priorityFilter;
        const matchesAssignee =
          assigneeFilter === "ALL" ||
          (assigneeFilter === "NONE" && !issue.assignee) ||
          issue.assignee?.id === assigneeFilter;
        return matchesSearch && matchesPriority && matchesAssignee;
      }),
    [issues, searchQuery, priorityFilter, assigneeFilter]
  );

  const issuesByStatus = React.useMemo(() => {
    const map = new Map<string, BoardIssue[]>();
    for (const s of statuses) map.set(s.id, []);
    for (const i of filteredIssues) {
      map.get(i.statusId)?.push(i);
    }
    return map;
  }, [filteredIssues, statuses]);

  // ---------- Realtime ----------
  const applyRemoteMove = React.useCallback(
    (data: { issueId: string; fromStatus: string; toStatus: string; actorName: string }) => {
      setIssues((prev) => {
        const target = statuses.find((s) => s.kind === data.toStatus);
        if (!target || !prev.some((i) => i.id === data.issueId)) return prev;
        return prev.map((i) =>
          i.id === data.issueId
            ? { ...i, statusId: target.id, statusKind: target.kind }
            : i
        );
      });
      push(`${data.actorName} moved a card`);
    },
    [statuses, push]
  );

  const { viewers, isConnected, announcement } = useProjectRealtime({
    projectId,
    currentUser,
    onIssueCreated: (payload) => {
      const status = statuses.find((s) => s.kind === payload.statusKind);
      if (!status) return;
      setIssues((prev) =>
        prev.some((i) => i.id === payload.id)
          ? prev
          : [
              {
                id: payload.id,
                key: `${projectKey}-${payload.number}`,
                number: payload.number,
                title: payload.title,
                description: null,
                statusId: status.id,
                statusKind: status.kind,
                priority: payload.priority as BoardIssue["priority"],
                sortOrder: payload.sortOrder,
                estimate: null,
                assignee: null,
                labels: [],
                commentsCount: 0,
              },
              ...prev,
            ]
      );
      push(`New issue ${projectKey}-${payload.number} created by a teammate`);
    },
    onIssueMoved: applyRemoteMove,
    onIssueDeleted: (issueId) => {
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    },
    onIssueUpdated: () => {
      // Light-touch: refresh server data in background
      router.refresh();
    },
  });

  // ---------- Mutations ----------
  const persistMove = React.useCallback(
    async (
      issue: BoardIssue,
      targetStatus: StatusColumnClient,
      prevSortOrder?: number,
      nextSortOrder?: number
    ) => {
      const snapshot = issues;
      try {
        const res = await fetch(
          `/api/v1/workspaces/${workspaceSlug}/projects/${projectSlug}/issues/${issue.number}/move`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetStatusId: targetStatus.id,
              previousIssueSortOrder: prevSortOrder,
              nextIssueSortOrder: nextSortOrder,
            }),
          }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setIssues((prev) =>
          prev.map((i) => (i.id === issue.id ? { ...i, ...mapIssue(data.issue, projectKey) } : i))
        );
        if (issue.statusKind !== targetStatus.kind) {
          push(`Moved ${issue.key} to ${targetStatus.name}`);
        }
      } catch {
        setIssues(snapshot);
        push(`Failed to move ${issue.key}`, "error");
      }
    },
    [issues, workspaceSlug, projectSlug, projectKey, push]
  );

  const handleDropIntoColumn = React.useCallback(
    (targetStatus: StatusColumnClient) => {
      if (!draggingId) return;
      const dragged = issues.find((i) => i.id === draggingId);
      setDraggingId(null);
      setDropTargetStatus(null);
      if (!dragged) return;

      const column = (issuesByStatus.get(targetStatus.id) ?? []).filter(
        (i) => i.id !== draggingId
      );
      void persistMove(dragged, targetStatus);
      // Note: precise position within column is preserved via column-end drop;
      // cross-column drops append to the end. Fine-grained insertion below.
      void column;
    },
    [draggingId, issues, issuesByStatus, persistMove]
  );

  const quickAdd = React.useCallback(
    async (statusKind: StatusKind, title: string) => {
      try {
        const res = await fetch(
          `/api/v1/workspaces/${workspaceSlug}/projects/${projectSlug}/issues`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, statusKind, priority: "MEDIUM" }),
          }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const mapped = mapIssue(data.issue, projectKey);
        setIssues((prev) => [...prev, mapped]);
        push(`Created ${mapped.key}`);
        router.refresh(); // keep sidebar counts honest
      } catch {
        push("Failed to create issue", "error");
      }
    },
    [workspaceSlug, projectSlug, projectKey, push, router]
  );

  const handleDeleteIssue = React.useCallback(
    (issueId: string) => {
      setOpenIssueKey(null);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      router.refresh();
    },
    [router]
  );

  // ---------- Keyboard navigation ----------
  const flatFocusTargets = React.useMemo(
    () => statuses.map((s) => issuesByStatus.get(s.id) ?? []),
    [statuses, issuesByStatus]
  );
  const focusedIssueId =
    flatFocusTargets[focusCol]?.[
      Math.min(focusRow, Math.max(0, flatFocusTargets[focusCol].length - 1))
    ]?.id ?? null;

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        return;
      }
      const maxRow = Math.max(0, flatFocusTargets[focusCol]?.length - 1);

      switch (e.key) {
        case "j":
        case "J":
        case "ArrowDown":
          e.preventDefault();
          setFocusRow((r) => Math.min(r + 1, maxRow));
          break;
        case "k":
        case "K":
        case "ArrowUp":
          e.preventDefault();
          setFocusRow((r) => Math.max(0, r - 1));
          break;
        case "h":
        case "H":
        case "ArrowLeft":
          e.preventDefault();
          setFocusCol((c) => Math.max(0, c - 1));
          setFocusRow(0);
          break;
        case "l":
        case "L":
        case "ArrowRight":
          e.preventDefault();
          setFocusCol((c) => Math.min(statuses.length - 1, c + 1));
          setFocusRow(0);
          break;
        case "Enter": {
          const target = flatFocusTargets[focusCol]?.[Math.min(focusRow, maxRow)];
          if (target) {
            e.preventDefault();
            setOpenIssueKey(target.key);
          }
          break;
        }
        case "/":
          e.preventDefault();
          document.getElementById("board-search")?.focus();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flatFocusTargets, focusCol, focusRow, statuses.length]);

  return (
    <div className="flex h-full min-w-0 flex-col">
      <ToastStack toasts={toasts} />

      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--bg-base)] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--accent)] to-[var(--palette-purple)] font-mono-id text-[11px] font-bold text-white shadow-[var(--shadow-xs)]">
              {projectKey.slice(0, 4)}
            </span>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-[var(--text)]">
                {projectName}
              </h1>
              <p className="font-mono-id text-[11px] text-[var(--text-subtle)]">
                {filteredIssues.length} of {issues.length} issues ·{" "}
                {isConnected ? "realtime connected" : "connecting…"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PresenceAvatars viewers={viewers} liveAnnouncement={announcement} />
            {members.length > 0 && (
              <div className="hidden items-center -space-x-1.5 lg:flex" title={`${members.length} members`}>
                {members.slice(0, 4).map((m) => (
                  <Avatar
                    key={m.id}
                    src={m.user.avatarUrl}
                    fallback={(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
                    size="xs"
                    className="ring-2 ring-[var(--bg-base)]"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Input
            id="board-search"
            leftIcon={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title or key… (/ to focus)"
            className="h-8 max-w-xs bg-[var(--bg-raised)]"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2 text-xs text-[var(--text)] outline-none focus-ring"
            aria-label="Filter by priority"
          >
            <option value="ALL">All priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="NONE">None</option>
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2 text-xs text-[var(--text)] outline-none focus-ring"
            aria-label="Filter by assignee"
          >
            <option value="ALL">Everyone</option>
            <option value="NONE">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.user.id}>
                {m.user.name ?? m.user.email}
              </option>
            ))}
          </select>

          {(searchQuery || priorityFilter !== "ALL" || assigneeFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("ALL");
                setAssigneeFilter("ALL");
              }}
              className="text-[11px] font-medium text-[var(--accent)] hover:underline"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto hidden items-center gap-1.5 font-mono-id text-[10px] text-[var(--text-subtle)] md:flex">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-[var(--success)]" /> live
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-[var(--warning)]" /> offline
              </>
            )}
            <span className="mx-1 opacity-40">|</span>
            J K H L move · Enter open · C new
          </span>
        </div>
      </div>

      {/* Columns */}
      <div className="min-h-0 flex-1 overflow-x-auto p-5">
        <div className="grid min-w-max grid-flow-col auto-cols-[280px] items-stretch gap-4 pb-4 lg:auto-cols-[minmax(260px,1fr)]">
          {statuses.map((st) => (
            <KanbanColumn
              key={st.id}
              id={st.id}
              name={st.name}
              kind={st.kind}
              issues={(issuesByStatus.get(st.id) ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)}
              focusedIssueId={focusedIssueId}
              isDropTarget={dropTargetStatus === st.id}
              onOpenIssue={(issue) => setOpenIssueKey(issue.key)}
              onQuickAdd={quickAdd}
              onDragStart={(_e, issue) => setDraggingId(issue.id)}
              onDragEnd={() => {
                setDraggingId(null);
                setDropTargetStatus(null);
              }}
              onDragOverColumn={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDropTargetStatus(st.id);
              }}
              onDropInto={() => handleDropIntoColumn(st)}
            />
          ))}
        </div>
      </div>

      {/* Detail slide-over */}
      <IssueDetailPanel
        issueKey={openIssueKey}
        workspaceSlug={workspaceSlug}
        members={members}
        onClose={() => setOpenIssueKey(null)}
        onChanged={(patch) => {
          if (!openIssueKey) return;
          setIssues((prev) =>
            prev.map((i) => {
              if (i.key !== openIssueKey) return i;
              const next: BoardIssue = { ...i };
              if (patch.statusKind && patch.statusKind !== i.statusKind) {
                const target = statuses.find((s) => s.kind === patch.statusKind);
                if (target) {
                  next.statusId = target.id;
                  next.statusKind = target.kind;
                }
              }
              if (patch.priority !== undefined) next.priority = patch.priority;
              if (patch.estimate !== undefined) next.estimate = patch.estimate;
              if (patch.assignee !== undefined)
                next.assignee = patch.assignee
                  ? {
                      id: patch.assignee.id,
                      name: patch.assignee.name,
                      avatarUrl: patch.assignee.avatarUrl ?? null,
                    }
                  : null;
              if (patch.title !== undefined) next.title = patch.title;
              if (patch.description !== undefined) next.description = patch.description;
              if (patch.commentsCountDelta) next.commentsCount += patch.commentsCountDelta;
              return next;
            })
          );
          router.refresh();
        }}
        onDeleted={() => {
          const issue = issues.find((i) => i.key === openIssueKey);
          setOpenIssueKey(null);
          if (issue) handleDeleteIssue(issue.id);
        }}
      />
    </div>
  );
}


