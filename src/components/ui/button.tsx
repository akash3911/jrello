import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] border border-transparent shadow-none font-semibold",
        secondary:
          "bg-[var(--bg-raised)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg-overlay)] hover:border-[var(--border-strong)] shadow-none",
        ghost:
          "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-overlay)] border border-transparent",
        danger:
          "bg-[var(--danger-soft)] text-[var(--danger-fg)] border border-[var(--danger)]/30 hover:bg-[var(--danger)] hover:text-white",
        outline:
          "bg-transparent text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg-raised)] hover:border-[var(--border-strong)]",
      },
      size: {
        sm: "h-8 px-2.5 text-xs rounded-[var(--radius-md)] gap-1.5",
        md: "h-9 px-3.5 text-sm rounded-[var(--radius-md)] gap-2",
        icon: "h-8 w-8 p-0 text-xs rounded-[var(--radius-md)]",
        "icon-md": "h-9 w-9 p-0 text-sm rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "sm",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
