"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PriorityLevel } from "@/components/ui/priority-badge";
import { StatusKind } from "@/components/ui/status-badge";

export interface CreateIssueModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (issue: {
    title: string;
    description: string;
    status: StatusKind;
    priority: PriorityLevel;
    estimate: string;
  }) => void;
  projectPrefix: string;
}

export function CreateIssueModal({
  open,
  onClose,
  onCreate,
  projectPrefix,
}: CreateIssueModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<StatusKind>("TODO");
  const [priority, setPriority] = React.useState<PriorityLevel>("MEDIUM");
  const [estimate, setEstimate] = React.useState("3 pts");
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      estimate,
    });
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("MEDIUM");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none transition-opacity select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-base)]">
          <div className="flex items-center gap-2">
            <Badge variant="mono" size="md">
              {projectPrefix}-NEW
            </Badge>
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Create New Issue
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-[var(--text-subtle)] hover:text-[var(--text)]"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
              Issue Title <span className="text-[var(--danger)]">*</span>
            </label>
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Clerk session provider in layout"
              className="text-xs"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
              Description (Markdown supported)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, acceptance criteria, or branch details..."
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] p-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-subtle)] focus-ring outline-none resize-none"
            />
          </div>

          {/* Form Selectors Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Status Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusKind)}
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2 text-xs text-[var(--text)] focus-ring outline-none"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2 text-xs text-[var(--text)] focus-ring outline-none"
              >
                <option value="URGENT">Urgent (Red)</option>
                <option value="HIGH">High (Orange)</option>
                <option value="MEDIUM">Medium (Yellow)</option>
                <option value="LOW">Low (Blue)</option>
                <option value="NONE">None</option>
              </select>
            </div>

            {/* Estimate */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--text-subtle)] uppercase">
                Estimate
              </label>
              <select
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                className="h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2 text-xs text-[var(--text)] focus-ring outline-none font-mono-id"
              >
                <option value="1 pt">1 pt (0.5d)</option>
                <option value="2 pts">2 pts (1d)</option>
                <option value="3 pts">3 pts (1.5d)</option>
                <option value="5 pts">5 pts (2.5d)</option>
                <option value="8 pts">8 pts (4d)</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] mt-1">
            <span className="text-[11px] font-mono-id text-[var(--text-subtle)]">
              ⌘+Enter to submit
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!title.trim()}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                Create Issue
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
