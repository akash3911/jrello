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
        mono: "font-mono-id bg-[var(--bg-inset)] text-[var(--text)] border border-[var(--border)] tracking-tight font-semibold",
        accent:
          "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/25",
        success:
          "bg-[var(--success-soft)] text-[var(--success-fg)] border border-[var(--success)]/25",
        warning:
          "bg-[var(--warning-soft)] text-[var(--warning-fg)] border border-[var(--warning)]/25",
        danger:
          "bg-[var(--danger-soft)] text-[var(--danger-fg)] border border-[var(--danger)]/25",
        info: "bg-[var(--info-soft)] text-[var(--info-fg)] border border-[var(--info)]/25",
        purple:
          "bg-[var(--palette-purple-soft)] text-[var(--palette-purple)] border border-[var(--palette-purple)]/25",
        orange:
          "bg-[var(--palette-orange-soft)] text-[var(--palette-orange)] border border-[var(--palette-orange)]/25",
      },
      size: {
        xs: "h-4.5 px-1.5 text-[10px] rounded-[3px]",
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
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
