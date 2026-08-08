"use client";

import * as React from "react";
import {
  X,
  GitBranch,
  GitPullRequest,
  CheckCircle2,
  MessageSquare,
  Copy,
  Check,
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

  const branch = issue.branchName || `feat/${issue.key.toLowerCase()}`;

  const copyGitCommand = () => {
    navigator.clipboard.writeText(`git checkout -b ${branch}`);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[var(--bg-raised)] border-l border-[var(--border)] shadow-[var(--shadow-lg)] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <Badge variant="mono" size="md">
            {issue.key}
          </Badge>
          <span className="text-xs text-[var(--text-subtle)] font-mono-id">
            Updated {issue.updatedAt}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--bg-overlay)] transition-colors focus-ring"
          title="Close panel (Escape)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Title */}
        <h2 className="text-base font-semibold text-[var(--text)] leading-snug">
          {issue.title}
        </h2>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border)] text-xs">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
              Status
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={issue.status} size="sm" />
              {onUpdateStatus && (
                <select
                  value={issue.status}
                  onChange={(e) => onUpdateStatus(e.target.value as StatusKind)}
                  className="text-[11px] bg-transparent border-none text-[var(--text-muted)] focus:outline-none cursor-pointer"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
              Priority
            </span>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={issue.priority} size="sm" />
              {onUpdatePriority && (
                <select
                  value={issue.priority}
                  onChange={(e) => onUpdatePriority(e.target.value as PriorityLevel)}
                  className="text-[11px] bg-transparent border-none text-[var(--text-muted)] focus:outline-none cursor-pointer"
                >
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="NONE">None</option>
                </select>
              )}
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

        {/* GitHub & Development Section (Phase 7) */}
        <div className="flex flex-col gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-[var(--accent)]" />
              <span className="font-semibold text-[var(--text)] uppercase tracking-wider text-[11px]">
                Development & GitHub
              </span>
            </div>
            <Badge variant="accent" size="sm">
              Wired to Git
            </Badge>
          </div>

          {/* Linked Branch */}
          <div className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)]">
            <div className="flex items-center gap-2 truncate">
              <GitBranch className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              <code className="font-mono-id text-[11px] text-[var(--text)] truncate">
                {branch}
              </code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyGitCommand}
              className="h-6 text-[10px] px-2 gap-1 text-[var(--accent)]"
            >
              {copiedBranch ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          {/* Linked Pull Request Mirror */}
          <div className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)]">
            <div className="flex items-center gap-2 truncate">
              <GitPullRequest className="h-3.5 w-3.5 text-[var(--success)] shrink-0" />
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-medium text-[var(--text)] truncate">
                  PR #{issue.key.split("-")[1] || "1"}: {issue.title}
                </span>
              </div>
            </div>
            <Badge variant="success" size="sm" className="gap-1 text-[10px]">
              <CheckCircle2 className="h-3 w-3" />
              <span>CI Passed</span>
            </Badge>
          </div>
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

        {/* Comments Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
              Discussion ({issue.commentsCount})
            </span>
          </div>

          {/* Comment Composer */}
          <div className="flex flex-col gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave a comment (markdown supported)..."
              rows={3}
              className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text)] focus-ring resize-none outline-none"
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                disabled={!commentText.trim()}
                onClick={() => {
                  setCommentText("");
                }}
                className="text-xs h-7"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
