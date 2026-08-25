"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, type PriorityLevel } from "@/components/ui/priority-badge";
import type { StatusKind } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export interface BoardIssue {
  id: string;
  key: string;
  number: number;
  title: string;
  description: string | null;
  statusId: string;
  statusKind: StatusKind;
  priority: PriorityLevel;
  sortOrder: number;
  estimate: number | null;
  assignee: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  labels: { label: { id: string; name: string; color: string } }[];
  commentsCount: number;
}

interface KanbanCardProps {
  issue: BoardIssue;
  isFocused?: boolean;
  isDragging?: boolean;
  onOpen?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function KanbanCard({
  issue,
  isFocused = false,
  isDragging = false,
  onOpen,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex cursor-grab select-none flex-col gap-2 rounded-[var(--radius-md)] border bg-[var(--bg-raised)] p-3 text-left shadow-[var(--shadow-xs)] transition-all duration-150 active:cursor-grabbing",
        "border-[var(--border)] hover:-translate-y-px hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]",
        isFocused && "!border-[var(--accent)] ring-1 ring-[var(--accent)]",
        isDragging && "scale-95 opacity-40"
      )}
    >
      {/* Key + priority */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono-id text-[11px] font-bold tracking-tight text-[var(--text-subtle)] transition-colors group-hover:text-[var(--accent)]">
          {issue.key}
        </span>
        <PriorityBadge priority={issue.priority} />
      </div>

      {/* Title */}
      <h3 className="line-clamp-3 min-h-[2.4em] text-xs font-medium leading-snug text-[var(--text)]">
        {issue.title}
      </h3>

      {/* Footer meta */}
      <div className="mt-auto flex items-center justify-between pt-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          {issue.assignee ? (
            <>
              <Avatar
                src={issue.assignee.avatarUrl}
                fallback={(issue.assignee.name ?? "U").slice(0, 2).toUpperCase()}
                size="xs"
              />
              <span className="max-w-24 truncate text-[10px] text-[var(--text-subtle)]">
                {issue.assignee.name ?? "Member"}
              </span>
            </>
          ) : (
            <span className="rounded-full border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--text-subtle)]">
              unassigned
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 text-[10px] font-mono-id text-[var(--text-subtle)]">
          {issue.commentsCount > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
              {issue.commentsCount}
            </span>
          )}
          {issue.estimate != null && issue.estimate > 0 && (
            <span>{issue.estimate}</span>
          )}
        </div>
      </div>

      {/* Labels strip */}
      {issue.labels.length > 0 && (
        <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
          {issue.labels.slice(0, 3).map(({ label }) => (
            <span
              key={label.id}
              title={label.name}
              className={`h-1.5 w-1.5 rounded-full bg-palette-${label.color}`}
              style={{
                backgroundColor: `var(--palette-${label.color})`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
