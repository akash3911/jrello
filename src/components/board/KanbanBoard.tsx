"use client";

import * as React from "react";
import { Search, Sparkles, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type StatusKind } from "@/components/ui/status-badge";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanIssueItem } from "./KanbanCard";
import { IssueDetailPanel, type IssueItem } from "./IssueDetailPanel";
import { PresenceAvatars } from "./PresenceAvatars";
import { useProjectRealtime } from "@/lib/realtime/client";

export interface StatusColumnData {
  id: string;
  name: string;
  kind: StatusKind;
  position: number;
  isDefault?: boolean;
}

interface KanbanBoardProps {
  projectKey: string;
  projectName: string;
  projectDescription?: string | null;
  workspaceSlug: string;
  initialStatuses: StatusColumnData[];
  initialIssues: KanbanIssueItem[];
  currentUser?: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function KanbanBoard({
  projectKey,
  projectName,
  projectDescription,
  workspaceSlug,
  initialStatuses,
  initialIssues,
  currentUser,
}: KanbanBoardProps) {
  const [statuses] = React.useState<StatusColumnData[]>(initialStatuses);
  const [issues, setIssues] = React.useState<KanbanIssueItem[]>(initialIssues);
  const [selectedIssue, setSelectedIssue] = React.useState<IssueItem | null>(null);

  // Keyboard navigation & focus state
  const [focusedColumnIndex, setFocusedColumnIndex] = React.useState<number>(1); // default to Todo
  const [focusedCardIndex, setFocusedCardIndex] = React.useState<number>(0);

  // Drag-and-drop state
  const [draggingIssue, setDraggingIssue] = React.useState<KanbanIssueItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<StatusKind | null>(null);

  // Filter toolbar state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time integration (Socket.IO + Presence)
  const { viewers, lastLiveMessage } = useProjectRealtime({
    projectId: projectKey,
    currentUser,
    onIssueMoved: (data) => {
      setIssues((prev) =>
        prev.map((i) =>
          i.id === data.issueId ? { ...i, status: data.toStatus, updatedAt: "Just now" } : i
        )
      );
      showToast(`${data.actorName} moved card to ${data.toStatus}`);
    },
    onIssueCreated: (newIssue) => {
      const card: KanbanIssueItem = {
        id: newIssue.id,
        key: `${projectKey}-${newIssue.number}`,
        title: newIssue.title,
        description: newIssue.description || "",
        status: newIssue.statusKind,
        priority: newIssue.priority,
        assignee: { name: "Team member", initials: "TM" },
        labels: ["realtime"],
        branchName: `feat/${projectKey.toLowerCase()}-${newIssue.number}`,
        commentsCount: 0,
        createdAt: "Just now",
        updatedAt: "Just now",
        estimate: newIssue.estimate ? `${newIssue.estimate} pts` : "3 pts",
      };
      setIssues((prev) => [card, ...prev]);
      showToast(`New issue #${newIssue.number} created`);
    },
  });

  // Filtered issues calculation
  const filteredIssues = React.useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.key.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === "ALL" || issue.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [issues, searchQuery, priorityFilter]);

  // Derived current column issues for keyboard navigation
  const currentColumnStatus = statuses[focusedColumnIndex]?.kind;
  const currentColumnIssues = React.useMemo(() => {
    return filteredIssues.filter((i) => i.status === currentColumnStatus);
  }, [filteredIssues, currentColumnStatus]);

  const focusedIssueId = currentColumnIssues[focusedCardIndex]?.id || null;

  // Keyboard navigation handler (J, K, H, L, Left, Right, Enter, C, Escape)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedCardIndex((prev) => Math.min(prev + 1, Math.max(0, currentColumnIssues.length - 1)));
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedCardIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "h" || e.key === "H" || e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedColumnIndex((prev) => Math.max(0, prev - 1));
        setFocusedCardIndex(0);
      } else if (e.key === "l" || e.key === "L" || e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedColumnIndex((prev) => Math.min(statuses.length - 1, prev + 1));
        setFocusedCardIndex(0);
      } else if (e.key === "Enter" && currentColumnIssues[focusedCardIndex]) {
        e.preventDefault();
        const currentItem = currentColumnIssues[focusedCardIndex];
        setSelectedIssue({
          id: currentItem.id,
          key: currentItem.key,
          title: currentItem.title,
          description: currentItem.description || "",
          status: currentItem.status,
          priority: currentItem.priority,
          assignee: currentItem.assignee,
          labels: currentItem.labels || [],
          branchName: currentItem.branchName,
          commentsCount: currentItem.commentsCount ?? 0,
          createdAt: currentItem.createdAt || "Just now",
          updatedAt: currentItem.updatedAt || "Just now",
          estimate: currentItem.estimate,
        });
      } else if (e.key === "Escape") {
        setSelectedIssue(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [statuses, currentColumnIssues, focusedCardIndex]);

  // Handle Drag & Drop move
  const handleDragStart = (issue: KanbanIssueItem) => {
    setDraggingIssue(issue);
  };

  const handleDragOver = (e: React.DragEvent, statusKind: StatusKind) => {
    e.preventDefault();
    if (dragOverColumn !== statusKind) {
      setDragOverColumn(statusKind);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: StatusKind) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggingIssue || draggingIssue.status === targetStatus) {
      setDraggingIssue(null);
      return;
    }

    const previousIssues = [...issues];
    const movedIssue = { ...draggingIssue, status: targetStatus, updatedAt: "Just now" };

    // 1. Optimistic UI update
    setIssues((prev) =>
      prev.map((item) => (item.id === draggingIssue.id ? movedIssue : item))
    );
    showToast(`Moved ${draggingIssue.key} to ${targetStatus}`);

    // 2. Persist move to backend API
    const targetStatusObj = statuses.find((s) => s.kind === targetStatus);
    const issueNum = draggingIssue.key.split("-")[1];

    if (targetStatusObj && issueNum) {
      try {
        const res = await fetch(
          `/api/v1/workspaces/${workspaceSlug}/projects/${projectKey.toLowerCase()}/issues/${issueNum}/move`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetStatusId: targetStatusObj.id,
            }),
          }
        );

        if (!res.ok) {
          throw new Error("Failed to persist card move");
        }
      } catch (err) {
        console.error("Card move failed, reverting:", err);
        // Rollback state on error
        setIssues(previousIssues);
        showToast(`Failed to move ${draggingIssue.key}. Reverting.`, "error");
      }
    }

    setDraggingIssue(null);
  };

  // Quick Add issue from column button
  const handleQuickAdd = async (statusKind: StatusKind, title: string) => {
    const nextNumber = issues.length + 101;
    const targetStatusObj = statuses.find((s) => s.kind === statusKind);

    const newCard: KanbanIssueItem = {
      id: `issue-${nextNumber}`,
      key: `${projectKey}-${nextNumber}`,
      title,
      description: "Created from Kanban board.",
      status: statusKind,
      priority: "MEDIUM",
      assignee: currentUser
        ? {
            name: currentUser.name || "You",
            initials: (currentUser.name || "ME").slice(0, 2).toUpperCase(),
          }
        : { name: "Assignee", initials: "ME" },
      labels: ["feature"],
      branchName: `feat/${projectKey.toLowerCase()}-${nextNumber}`,
      commentsCount: 0,
      createdAt: "Just now",
      updatedAt: "Just now",
      estimate: "3 pts",
    };

    // Optimistic insert
    setIssues((prev) => [newCard, ...prev]);
    showToast(`Created ${newCard.key}`);

    // Persist via REST API
    try {
      await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${projectKey.toLowerCase()}/issues`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            statusId: targetStatusObj?.id,
            priority: "MEDIUM",
          }),
        }
      );
    } catch (err) {
      console.error("Failed to persist new issue:", err);
    }
  };

  return (
    <div className="flex h-full flex-col min-w-0 bg-[var(--bg-base)]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-3.5 py-2 rounded-[var(--radius-sm)] text-xs font-medium shadow-[var(--shadow-md)] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "error"
              ? "bg-[var(--danger-soft)] text-[var(--danger-fg)] border border-[var(--danger)]/40"
              : "bg-[var(--bg-raised)] text-[var(--text)] border border-[var(--border-strong)]"
          }`}
        >
          {toastMessage.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-[var(--danger)] shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 text-[var(--accent)] shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Project Header Bar with Live Presence Avatars */}
      <div className="flex flex-col gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-base)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-fg)] font-mono-id font-bold text-sm">
              {projectKey}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-[var(--text)] tracking-tight">
                  {projectName}
                </h1>
                <Badge variant="accent" size="sm">
                  {projectKey}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {projectDescription || `Interactive Kanban board in ${workspaceSlug}.`}
              </p>
            </div>
          </div>

          {/* Real-time Presence Avatars & Announcements */}
          <PresenceAvatars viewers={viewers} liveAnnouncement={lastLiveMessage} />
        </div>

        {/* Filters, Search, and Keyboard Shortcuts Hint */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              leftIcon={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter issues (press /)..."
              className="h-8 text-xs bg-[var(--bg-raised)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 text-xs text-[var(--text)] focus-ring outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="NONE">None</option>
            </select>

            <span className="text-xs font-mono-id text-[var(--text-subtle)] pl-1">
              {filteredIssues.length} issues
            </span>
          </div>
        </div>
      </div>

      {/* Board Columns (Horizontal scrolling surface) */}
      <div className="flex-1 overflow-x-auto p-6 bg-[var(--bg-base)]">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-[1100px] items-start pb-6">
          {statuses.map((st) => {
            const colIssues = filteredIssues.filter((i) => i.status === st.kind);

            return (
              <KanbanColumn
                key={st.id}
                id={st.id}
                name={st.name}
                kind={st.kind}
                issues={colIssues}
                focusedIssueId={focusedIssueId}
                selectedIssueId={selectedIssue?.id}
                isDropTarget={dragOverColumn === st.kind}
                onSelectIssue={(issue) => {
                  setSelectedIssue({
                    id: issue.id,
                    key: issue.key,
                    title: issue.title,
                    description: issue.description || "",
                    status: issue.status,
                    priority: issue.priority,
                    assignee: issue.assignee,
                    labels: issue.labels || [],
                    branchName: issue.branchName,
                    commentsCount: issue.commentsCount ?? 0,
                    createdAt: issue.createdAt || "Just now",
                    updatedAt: issue.updatedAt || "Just now",
                    estimate: issue.estimate,
                  });
                }}
                onQuickAdd={(kind, title) => handleQuickAdd(kind, title)}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleDragOver(e, st.kind)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={handleDrop}
              />
            );
          })}
        </div>
      </div>

      {/* Slide-over Issue Detail Panel */}
      <IssueDetailPanel
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdateStatus={(newStatus) => {
          if (selectedIssue) {
            setIssues((prev) =>
              prev.map((item) =>
                item.id === selectedIssue.id ? { ...item, status: newStatus } : item
              )
            );
            setSelectedIssue((prev) => (prev ? { ...prev, status: newStatus } : null));
          }
        }}
      />
    </div>
  );
}
