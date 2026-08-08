"use client";

import * as React from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";
import { KanbanCard, type KanbanIssueItem } from "./KanbanCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  name: string;
  kind: StatusKind;
  issues: KanbanIssueItem[];
  focusedIssueId?: string | null;
  selectedIssueId?: string | null;
  isDropTarget?: boolean;
  onSelectIssue: (issue: KanbanIssueItem) => void;
  onQuickAdd: (statusKind: StatusKind, title: string) => void;
  onDragStart: (issue: KanbanIssueItem) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStatus: StatusKind) => void;
}

export function KanbanColumn({
  name,
  kind,
  issues,
  focusedIssueId,
  selectedIssueId,
  isDropTarget = false,
  onSelectIssue,
  onQuickAdd,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: KanbanColumnProps) {
  const [isComposing, setIsComposing] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onQuickAdd(kind, newTitle.trim());
    setNewTitle("");
    setIsComposing(false);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, kind)}
      className={cn(
        "flex flex-col rounded-[var(--radius-md)] border min-h-[520px] transition-colors duration-150",
        "bg-[var(--bg-raised)]/60 border-[var(--border)]",
        isDropTarget && "border-[var(--accent)] bg-[var(--accent-soft)]/20 ring-1 ring-[var(--accent)]"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)] bg-[var(--bg-raised)] select-none">
        <div className="flex items-center gap-2">
          <StatusBadge status={kind} showLabel={false} size="sm" />
          <span className="text-xs font-semibold text-[var(--text)]">
            {name}
          </span>
          <span className="font-mono-id text-[11px] text-[var(--text-subtle)] px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border)]">
            {issues.length}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsComposing(true)}
          className="h-6 w-6 text-[var(--text-subtle)] hover:text-[var(--text)]"
          title={`Quick add issue to ${name} (C)`}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Inline Issue Composer */}
      {isComposing && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-[var(--border)] bg-[var(--bg-overlay)] flex flex-col gap-2">
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsComposing(false);
                setNewTitle("");
              }
            }}
            placeholder="Issue title... (Press Enter to save, Esc to cancel)"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--accent)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-subtle)] font-mono-id">
              Esc to cancel
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsComposing(false)}
                className="h-6 text-[11px] px-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!newTitle.trim()}
                className="h-6 text-[11px] px-2 gap-1"
              >
                <span>Add</span>
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Cards List / Drop Target Container */}
      <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
        {issues.length === 0 && !isComposing ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg-base)]/40 my-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              No issues in {name}
            </span>
            <p className="text-[11px] text-[var(--text-subtle)] mt-0.5">
              Drag cards here or press <kbd className="px-1 py-0.5 rounded border border-[var(--border)] font-mono-id text-[10px]">C</kbd>
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsComposing(true)}
              className="mt-3 text-xs text-[var(--accent)] hover:underline h-7 px-2.5"
            >
              + Quick Add
            </Button>
          </div>
        ) : (
          issues.map((issue) => (
            <KanbanCard
              key={issue.id}
              issue={issue}
              isSelected={issue.id === selectedIssueId}
              isKeyboardFocused={issue.id === focusedIssueId}
              onClick={() => onSelectIssue(issue)}
              onDragStart={() => onDragStart(issue)}
            />
          ))
        )}
      </div>
    </div>
  );
}
