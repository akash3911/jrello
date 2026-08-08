import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bg-overlay)] text-[var(--text-muted)] border border-[var(--border)]",
        mono: "font-mono-id bg-[var(--bg-raised)] text-[var(--text)] border border-[var(--border)] tracking-tight font-semibold",
        accent:
          "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20",
        success:
          "bg-[var(--success-soft)] text-[var(--success-fg)] border border-[var(--success)]/20",
        warning:
          "bg-[var(--warning-soft)] text-[var(--warning-fg)] border border-[var(--warning)]/20",
        danger:
          "bg-[var(--danger-soft)] text-[var(--danger-fg)] border border-[var(--danger)]/20",
        info: "bg-[var(--info-soft)] text-[var(--info-fg)] border border-[var(--info)]/20",
        purple:
          "bg-[var(--palette-purple-soft)] text-[var(--palette-purple)] border border-[var(--palette-purple)]/20",
        orange:
          "bg-[var(--palette-orange-soft)] text-[var(--palette-orange)] border border-[var(--palette-orange)]/20",
      },
      size: {
        sm: "h-5 px-1.5 text-[11px] rounded-[var(--radius-sm)]",
        md: "h-6 px-2 text-xs rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
