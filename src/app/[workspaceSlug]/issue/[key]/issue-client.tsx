"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge, type PriorityLevel } from "@/components/ui/priority-badge";
import { StatusBadge, type StatusKind } from "@/components/ui/status-badge";

export interface CommentUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string | Date;
  user: CommentUser;
}

export interface FullIssueData {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: {
    id: string;
    name: string;
    kind: StatusKind;
  };
  priority: PriorityLevel;
  estimate: number | null;
  createdAt: string | Date;
  assignee: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string | null;
  };
  project: {
    id: string;
    name: string;
    slug: string;
    key: string;
  };
  comments: CommentItem[];
}

interface StandaloneClientProps {
  issue: FullIssueData;
  workspaceSlug: string;
}

export default function IssueDetailStandaloneClient({
  issue,
  workspaceSlug,
}: StandaloneClientProps) {
  const [currentStatus, setCurrentStatus] = React.useState<StatusKind>(
    issue.status.kind
  );
  const [currentPriority, setCurrentPriority] = React.useState<PriorityLevel>(
    issue.priority
  );
  const [commentText, setCommentText] = React.useState("");
  const [comments, setComments] = React.useState<CommentItem[]>(issue.comments || []);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: CommentItem = {
      id: `comment-${Date.now()}`,
      body: commentText.trim(),
      createdAt: new Date().toISOString(),
      user: {
        id: "me",
        name: "You",
        email: "you@jrello.com",
        avatarUrl: null,
      },
    };

    setComments((prev) => [...prev, newComment]);
    setCommentText("");
  };

  const project = issue.project;

  return (
    <AppShell>
      <div className="flex h-full flex-col min-w-0 bg-[var(--bg-base)] overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <Link
              href={`/${workspaceSlug}/projects/${project.slug}`}
              className="flex items-center gap-2 text-xs text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to {project.name} Board</span>
            </Link>

            <div className="flex items-center gap-2">
              <Badge variant="mono" size="sm">
                {project.key}-{issue.number}
              </Badge>
            </div>
          </div>

          {/* Main Grid: Content + Meta Column */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left 2 Cols: Issue Content & Discussion */}
            <div className="md:col-span-2 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold text-[var(--text)] leading-snug">
                  {issue.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)]">
                  <span>Created {new Date(issue.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>By {issue.createdBy.name || "Team member"}</span>
                </div>
              </div>

              {/* Description Body */}
              <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] text-xs text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                {issue.description || "No description provided."}
              </div>

              {/* Git Branch / Context */}
              <div className="p-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-overlay)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[var(--accent)]" />
                  <span className="font-mono-id text-xs text-[var(--text)] font-medium">
                    feat/{project.key.toLowerCase()}-{issue.number}
                  </span>
                </div>
                <Badge variant="accent" size="sm">
                  Active Branch
                </Badge>
              </div>

              {/* Comments Stream */}
              <div className="flex flex-col gap-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
                  <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
                    Discussion ({comments.length})
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-[var(--text-subtle)] font-mono-id">
                      No comments yet. Start the discussion below.
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[var(--text)]">
                            {c.user.name || "Developer"}
                          </span>
                          <span className="text-[var(--text-subtle)] font-mono-id">
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                          {c.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* New Comment Box */}
                <form onSubmit={handleAddComment} className="flex flex-col gap-2 pt-2">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment or markdown update..."
                    className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] p-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-subtle)] focus-ring outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={!commentText.trim()}
                      className="text-xs"
                    >
                      Post Comment
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Col: Metadata Properties */}
            <div className="flex flex-col gap-5 p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] h-fit">
              <h3 className="text-xs font-semibold text-[var(--text-subtle)] uppercase tracking-wider">
                Properties
              </h3>

              {/* Status Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <StatusBadge status={currentStatus} size="sm" />
                  <select
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value as StatusKind)}
                    className="h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2 text-xs text-[var(--text)] focus-ring outline-none"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              {/* Priority Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
                  Priority
                </label>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={currentPriority} size="sm" />
                  <select
                    value={currentPriority}
                    onChange={(e) => setCurrentPriority(e.target.value as PriorityLevel)}
                    className="h-7 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-2 text-xs text-[var(--text)] focus-ring outline-none"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                    <option value="NONE">None</option>
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
                  Assignee
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <Avatar
                    fallback={(issue.assignee?.name || "ME").slice(0, 2).toUpperCase()}
                    size="xs"
                    className="bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                  />
                  <span className="text-[var(--text)]">
                    {issue.assignee?.name || "Unassigned"}
                  </span>
                </div>
              </div>

              {/* Story Points */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-subtle)] uppercase">
                  Estimate
                </label>
                <span className="font-mono-id text-xs text-[var(--text)] font-medium">
                  {issue.estimate ? `${issue.estimate} points` : "3 points"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
