import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isDragging?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, isDragging, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text)] transition-colors duration-[var(--duration-fast)]",
        isDragging
          ? "border-[var(--accent)] shadow-[var(--shadow-lg)] scale-[1.02] cursor-grabbing"
          : "hover:border-[var(--border-strong)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
