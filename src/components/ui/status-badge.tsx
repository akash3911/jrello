import * as React from "react";
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

/** Dot color per workflow kind — reads cleanly at any size. */
const dotClass: Record<StatusKind, string> = {
  BACKLOG: "bg-[var(--palette-gray)]",
  TODO: "bg-[var(--text-subtle)]",
  IN_PROGRESS: "bg-[var(--accent)]",
  IN_REVIEW: "bg-[var(--palette-purple)]",
  DONE: "bg-[var(--success)]",
  CANCELED: "bg-[var(--danger)]",
};

const label: Record<StatusKind, string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELED: "Canceled",
};

export function StatusBadge({
  status,
  showLabel = true,
  className,
  size = "sm",
}: StatusBadgeProps) {
  return (
    <span
      title={`Status: ${label[status] ?? status}`}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-[var(--radius-sm)] select-none whitespace-nowrap",
        size === "sm" ? "h-5 px-1 text-[11px]" : "h-6 px-1.5 text-xs",
        !showLabel && "px-0.5",
        className
      )}
    >
      <span
        className={cn(
          "rounded-full shrink-0",
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
          dotClass[status] ?? dotClass.BACKLOG
        )}
      />
      {showLabel && (
        <span className="text-[var(--text-muted)]">{label[status] ?? status}</span>
      )}
    </span>
  );
}
