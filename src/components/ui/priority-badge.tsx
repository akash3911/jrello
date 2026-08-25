import * as React from "react";
import { cn } from "@/lib/utils";

export type PriorityLevel = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

interface PriorityBadgeProps {
  priority: PriorityLevel;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const bars: Record<PriorityLevel, number> = {
  URGENT: 3,
  HIGH: 2,
  MEDIUM: 1,
  LOW: 0,
  NONE: -1,
};

const barColor: Record<PriorityLevel, string> = {
  URGENT: "bg-[var(--palette-red)]",
  HIGH: "bg-[var(--palette-orange)]",
  MEDIUM: "bg-[var(--palette-yellow)]",
  LOW: "bg-[var(--palette-blue)]",
  NONE: "bg-transparent",
};

const priorityLabel: Record<PriorityLevel, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  NONE: "No priority",
};

/** Signal-style ascending bars — instantly scannable in dense lists. */
export function PriorityBadge({
  priority,
  showLabel = false,
  className,
  size = "sm",
}: PriorityBadgeProps) {
  const level = bars[priority] ?? -1;

  return (
    <span
      title={`Priority: ${priorityLabel[priority]}`}
      className={cn(
        "inline-flex items-center gap-1.5 select-none whitespace-nowrap rounded-[var(--radius-sm)]",
        size === "sm" ? "h-5 px-1 text-[11px]" : "h-6 px-1.5 text-xs",
        className
      )}
    >
      <span className="flex items-end gap-[2px] h-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-[1px]",
              i === 0 ? "h-1.5" : i === 1 ? "h-2" : "h-2.5",
              level >= i && level >= 0 ? barColor[priority] : "bg-[var(--border-strong)]"
            )}
          />
        ))}
      </span>
      {showLabel && (
        <span className="text-[var(--text-muted)] font-medium">{priorityLabel[priority]}</span>
      )}
    </span>
  );
}
