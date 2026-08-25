import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text)] shadow-[var(--shadow-xs)] transition-colors duration-[var(--duration-fast)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
