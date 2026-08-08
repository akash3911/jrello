"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, type PriorityLevel } from "@/components/ui/priority-badge";
import { type StatusKind } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export interface KanbanIssueItem {
  id: string;
  key: string;
  title: string;
  description?: string;
  status: StatusKind;
  priority: PriorityLevel;
  assignee: {
    name: string;
    avatar?: string | null;
    initials: string;
  };
  labels?: string[];
  branchName?: string;
  commentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  estimate?: string;
}

interface KanbanCardProps {
  issue: KanbanIssueItem;
  isSelected?: boolean;
  isDragging?: boolean;
  isKeyboardFocused?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function KanbanCard({
  issue,
  isSelected = false,
  isDragging = false,
  isKeyboardFocused = false,
  onClick,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex flex-col gap-2 rounded-[var(--radius-sm)] border p-3 text-left transition-all duration-150 select-none cursor-grab active:cursor-grabbing",
        "bg-[var(--bg-raised)] border-[var(--border)]",
        "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5",
        isSelected && "border-[var(--accent)] ring-1 ring-[var(--accent)]",
        isKeyboardFocused && "ring-2 ring-[var(--accent)] border-[var(--accent)] shadow-[0_0_0_2px_var(--accent-soft)]",
        isDragging && "opacity-40 border-dashed border-[var(--accent)] scale-95"
      )}
    >
      {/* Top row: Issue Key & Priority */}
      <div className="flex items-center justify-between gap-2">
        <Badge variant="mono" size="sm" className="font-bold text-[11px] group-hover:border-[var(--accent)] transition-colors">
          {issue.key}
        </Badge>
        <PriorityBadge priority={issue.priority} showLabel={false} size="sm" />
      </div>

      {/* Title */}
      <h3 className="text-xs font-medium text-[var(--text)] leading-snug line-clamp-2">
        {issue.title}
      </h3>

      {/* Footer: Assignee + Estimate */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]/40 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar
            fallback={issue.assignee.initials}
            size="xs"
            className="bg-[var(--accent-soft)] text-[var(--accent)] font-semibold shrink-0"
          />
          <span className="text-[var(--text-muted)] text-[11px] truncate max-w-[100px]">
            {issue.assignee.name}
          </span>
        </div>

        {issue.estimate && (
          <span className="font-mono-id text-[10px] text-[var(--text-subtle)] font-medium shrink-0">
            {issue.estimate}
          </span>
        )}
      </div>
    </div>
  );
}
