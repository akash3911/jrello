"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";
import { KanbanCard, type BoardIssue } from "./KanbanCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  name: string;
  kind: StatusKind;
  issues: BoardIssue[];
  focusedIssueId?: string | null;
  isDropTarget: boolean;
  onOpenIssue: (issue: BoardIssue) => void;
  onQuickAdd: (statusKind: StatusKind, title: string) => Promise<void>;
  onDragStart: (e: React.DragEvent, issue: BoardIssue) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOverColumn: (e: React.DragEvent) => void;
  onDropInto: (e: React.DragEvent) => void;
  registerDropRef?: (el: HTMLDivElement | null) => void;
}

export function KanbanColumn({
  id,
  name,
  kind,
  issues,
  focusedIssueId,
  isDropTarget,
  onOpenIssue,
  onQuickAdd,
  onDragStart,
  onDragEnd,
  onDragOverColumn,
  onDropInto,
}: KanbanColumnProps) {
  const [composing, setComposing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const submit = async () => {
    const title = draft.trim();
    if (!title) return;
    setSaving(true);
    try {
      await onQuickAdd(kind, title);
      setDraft("");
      setComposing(false);
    } finally {
      setSaving(false);
    }
  };

  // Keep the focused card visible while navigating with J/K
  React.useEffect(() => {
    if (!focusedIssueId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-issue-id="${focusedIssueId}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [focusedIssueId]);

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-[var(--radius-md)] border transition-colors duration-150",
        "border-[var(--border)] bg-[var(--bg-raised)]/50",
        isDropTarget && "border-[var(--accent)] bg-[var(--accent-soft)]/40 ring-1 ring-[var(--accent)]"
      )}
      data-column-id={id}
      onDragOver={(e) => onDragOverColumn(e)}
      onDrop={onDropInto}
    >
      {/* Header */}
      <header className="flex select-none items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={kind} />
          <span className="rounded border border-[var(--border)] bg-[var(--bg-base)] px-1.5 py-px font-mono-id text-[10px] text-[var(--text-subtle)]">
            {issues.length}
          </span>
        </div>
        <button
          onClick={() => setComposing(true)}
          title={`Quick add to ${name}`}
          className="rounded p-0.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text)] focus-ring"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </header>

      {/* Inline composer */}
      {composing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="flex flex-col gap-2 border-b border-[var(--border)] bg-[var(--bg-overlay)] p-2"
        >
          <textarea
            autoFocus
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
              if (e.key === "Escape") {
                setComposing(false);
                setDraft("");
              }
            }}
            placeholder={`${name}: issue title…`}
            className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--accent)]/50 bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)]"
          />
          <div className="flex items-center justify-between">
            <span className="font-mono-id text-[9px] text-[var(--text-subtle)]">
              ↵ save · shift+↵ newline · esc cancel
            </span>
            <span className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setComposing(false);
                  setDraft("");
                }}
                className="inline-flex h-6 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--text)]"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
              <button
                type="submit"
                disabled={!draft.trim() || saving}
                className="inline-flex h-6 items-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-2 text-[11px] font-semibold text-white disabled:opacity-40"
              >
                {saving ? "Adding…" : "Add"}
              </button>
            </span>
          </div>
        </form>
      )}

      {/* Cards */}
      <div ref={scrollRef} className="flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2">
        {issues.length === 0 && !composing ? (
          <button
            onClick={() => setComposing(true)}
            className="my-2 flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] py-8 text-center transition-colors hover:border-[var(--border-strong)]"
          >
            <Plus className="h-4 w-4 text-[var(--text-subtle)]" />
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              Nothing in {name}
            </span>
            <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
              click to add
            </span>
          </button>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} data-issue-id={issue.id}>
              <KanbanCard
                issue={issue}
                isFocused={focusedIssueId === issue.id}
                onOpen={() => onOpenIssue(issue)}
                onDragStart={(e) => onDragStart(e, issue)}
                onDragEnd={onDragEnd}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
