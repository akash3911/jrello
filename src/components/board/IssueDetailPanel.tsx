"use client";

import * as React from "react";
import {
  X,
  GitBranch,
  Check,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, type PriorityLevel } from "@/components/ui/priority-badge";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";

export interface IssueItem {
  id: string;
  key: string;
  title: string;
  description: string;
  status: StatusKind;
  priority: PriorityLevel;
  assignee: {
    name: string;
    avatar?: string | null;
    initials: string;
  };
  labels: string[];
  branchName?: string;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  estimate?: string;
}

export interface IssueDetailPanelProps {
  issue: IssueItem | null;
  onClose: () => void;
  onUpdateStatus?: (status: StatusKind) => void;
  onUpdatePriority?: (priority: PriorityLevel) => void;
}

export function IssueDetailPanel({
  issue,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
}: IssueDetailPanelProps) {
  const [copiedBranch, setCopiedBranch] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && issue) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [issue, onClose]);

  if (!issue) return null;

  const branch =
    issue.branchName ||
    `feat/${issue.key.toLowerCase()}-${issue.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30)}`;

  const copyGitCommand = () => {
    navigator.clipboard.writeText(`git checkout -b ${branch}`);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl border-l border-[var(--border-strong)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-base)]">
        <div className="flex items-center gap-2">
          <Badge variant="mono" size="md" className="font-semibold">
            {issue.key}
          </Badge>
          <span className="text-xs text-[var(--text-subtle)] font-mono-id">
            Updated {issue.updatedAt}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyGitCommand}
            className="h-7 text-xs gap-1.5 font-mono-id"
            title="Copy git branch command"
          >
            {copiedBranch ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                <span className="text-[var(--success)]">Copied</span>
              </>
            ) : (
              <>
                <GitBranch className="h-3.5 w-3.5" />
                <span>Copy Branch</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-[var(--text-muted)] hover:text-[var(--text)]"
            title="Close panel (Esc)"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* Main body */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Title */}
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)] tracking-tight leading-snug">
            {issue.title}
          </h1>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] text-xs">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
              Status
            </span>
            <div className="flex items-center gap-2">
              <select
                value={issue.status}
                onChange={(e) => onUpdateStatus && onUpdateStatus(e.target.value as StatusKind)}
                className="h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2 text-xs text-[var(--text)] outline-none"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
                <option value="CANCELED">Canceled</option>
              </select>
              <StatusBadge status={issue.status} showLabel={false} size="sm" />
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
              Priority
            </span>
            <div className="flex items-center gap-2">
              <select
                value={issue.priority}
                onChange={(e) => onUpdatePriority && onUpdatePriority(e.target.value as PriorityLevel)}
                className="h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-2 text-xs text-[var(--text)] outline-none"
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="NONE">None</option>
              </select>
              <PriorityBadge priority={issue.priority} showLabel={false} size="sm" />
            </div>
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
              Assignee
            </span>
            <div className="flex items-center gap-1.5">
              <Avatar
                fallback={issue.assignee.initials}
                size="xs"
                className="bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
              />
              <span className="font-medium text-[var(--text)]">
                {issue.assignee.name}
              </span>
            </div>
          </div>

          {/* Estimate */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
              Estimate
            </span>
            <span className="font-mono-id text-[var(--text-muted)] font-medium">
              {issue.estimate || "3 pts (1.5d)"}
            </span>
          </div>
        </div>

        {/* Git Branch Banner */}
        <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="h-4 w-4 text-[var(--accent)] shrink-0" strokeWidth={1.5} />
            <code className="font-mono-id text-[11px] text-[var(--text)] truncate">
              {branch}
            </code>
          </div>
          <button
            onClick={copyGitCommand}
            className="text-[11px] font-mono-id text-[var(--accent)] hover:underline shrink-0 ml-2"
          >
            {copiedBranch ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
            Description
          </span>
          <div className="p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text)] leading-relaxed whitespace-pre-line">
            {issue.description ||
              "No description provided for this work item. Use markdown, link PRs, or specify acceptance criteria."}
          </div>
        </div>

        {/* Labels / Tags */}
        {issue.labels && issue.labels.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
              Labels
            </span>
            <div className="flex flex-wrap gap-1.5">
              {issue.labels.map((label) => (
                <Badge key={label} variant="purple" size="sm">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Activity & Comments Thread */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[var(--accent)]" />
              Activity & Comments ({issue.commentsCount})
            </span>
            <span className="text-[11px] font-mono-id text-[var(--text-subtle)]">
              Real-time sync ready
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {/* Timeline item */}
            <div className="flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
              <Avatar fallback="SC" size="xs" />
              <div className="flex flex-col">
                <div>
                  <span className="font-medium text-[var(--text)]">Sarah Chen</span>{" "}
                  moved issue to <span className="font-mono-id text-[var(--accent)]">In Progress</span>
                </div>
                <span className="text-[10px] text-[var(--text-subtle)] font-mono-id">
                  Today at 2:14 PM
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
              <Avatar fallback="AM" size="xs" />
              <div className="flex flex-col">
                <div>
                  <span className="font-medium text-[var(--text)]">Alex Mercer</span>{" "}
                  created branch <code className="font-mono-id text-[var(--text)]">{branch}</code>
                </div>
                <span className="text-[10px] text-[var(--text-subtle)] font-mono-id">
                  Today at 1:45 PM
                </span>
              </div>
            </div>
          </div>

          {/* Quick Comment Input */}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave a comment (Markdown supported)..."
              className="flex-1 h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-subtle)] focus-ring outline-none"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCommentText("")}
              disabled={!commentText.trim()}
              className="text-xs"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
