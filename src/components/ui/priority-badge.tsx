import * as React from "react";
import {
  ArrowUp,
  Minus,
  ArrowDown,
  ChevronsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PriorityLevel = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

interface PriorityBadgeProps {
  priority: PriorityLevel;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const config: Record<
  PriorityLevel,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badgeClass: string;
    iconClass: string;
  }
> = {
  URGENT: {
    label: "Urgent",
    icon: ChevronsUp,
    badgeClass:
      "bg-[var(--danger-soft)] text-[var(--danger-fg)] border-[var(--danger)]/30",
    iconClass: "text-[var(--danger)]",
  },
  HIGH: {
    label: "High",
    icon: ArrowUp,
    badgeClass:
      "bg-[var(--palette-orange-soft)] text-[var(--palette-orange)] border-[var(--palette-orange)]/30",
    iconClass: "text-[var(--palette-orange)]",
  },
  MEDIUM: {
    label: "Medium",
    icon: Minus,
    badgeClass:
      "bg-[var(--warning-soft)] text-[var(--warning-fg)] border-[var(--warning)]/30",
    iconClass: "text-[var(--warning)]",
  },
  LOW: {
    label: "Low",
    icon: ArrowDown,
    badgeClass:
      "bg-[var(--info-soft)] text-[var(--info-fg)] border-[var(--info)]/30",
    iconClass: "text-[var(--info)]",
  },
  NONE: {
    label: "No priority",
    icon: Minus,
    badgeClass:
      "bg-[var(--bg-overlay)] text-[var(--text-subtle)] border-[var(--border)]",
    iconClass: "text-[var(--text-subtle)] opacity-40",
  },
};

export function PriorityBadge({
  priority,
  showLabel = true,
  className,
  size = "sm",
}: PriorityBadgeProps) {
  const current = config[priority] || config.NONE;
  const Icon = current.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium border rounded-[var(--radius-sm)] select-none",
        current.badgeClass,
        size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-xs",
        className
      )}
      title={`Priority: ${current.label}`}
    >
      <Icon className={cn("h-3 w-3 shrink-0", current.iconClass)} strokeWidth={1.5} />
      {showLabel && <span>{current.label}</span>}
    </span>
  );
}
