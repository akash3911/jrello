import * as React from "react";
import {
  Circle,
  Clock,
  PlayCircle,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusKind =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELED";

interface StatusBadgeProps {
  status: StatusKind;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const statusConfig: Record<
  StatusKind,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badgeClass: string;
    iconClass: string;
  }
> = {
  BACKLOG: {
    label: "Backlog",
    icon: Circle,
    badgeClass:
      "bg-[var(--bg-overlay)] text-[var(--text-muted)] border-[var(--border)]",
    iconClass: "text-[var(--text-subtle)]",
  },
  TODO: {
    label: "Todo",
    icon: Clock,
    badgeClass:
      "bg-[var(--bg-raised)] text-[var(--text)] border-[var(--border-strong)]",
    iconClass: "text-[var(--text-muted)]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: PlayCircle,
    badgeClass:
      "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30",
    iconClass: "text-[var(--accent)]",
  },
  IN_REVIEW: {
    label: "In Review",
    icon: Eye,
    badgeClass:
      "bg-[var(--palette-purple-soft)] text-[var(--palette-purple)] border-[var(--palette-purple)]/30",
    iconClass: "text-[var(--palette-purple)]",
  },
  DONE: {
    label: "Done",
    icon: CheckCircle2,
    badgeClass:
      "bg-[var(--success-soft)] text-[var(--success-fg)] border-[var(--success)]/30",
    iconClass: "text-[var(--success)]",
  },
  CANCELED: {
    label: "Canceled",
    icon: XCircle,
    badgeClass:
      "bg-[var(--bg-overlay)] text-[var(--text-subtle)] border-[var(--border)] line-through",
    iconClass: "text-[var(--text-subtle)]",
  },
};

export function StatusBadge({
  status,
  showLabel = true,
  className,
  size = "sm",
}: StatusBadgeProps) {
  const current = statusConfig[status] || statusConfig.BACKLOG;
  const Icon = current.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-[var(--radius-sm)] select-none",
        current.badgeClass,
        size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-xs",
        className
      )}
      title={`Status: ${current.label}`}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", current.iconClass)} strokeWidth={1.5} />
      {showLabel && <span>{current.label}</span>}
    </span>
  );
}
