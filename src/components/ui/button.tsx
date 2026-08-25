import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] border border-transparent font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12)]",
        secondary:
          "bg-[var(--bg-raised)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg-overlay)] hover:border-[var(--border-strong)]",
        ghost:
          "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-overlay)] border border-transparent",
        danger:
          "bg-[var(--danger-soft)] text-[var(--danger-fg)] border border-[var(--danger)]/30 hover:bg-[var(--danger)] hover:text-white hover:border-transparent",
        outline:
          "bg-transparent text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--bg-raised)] hover:border-[var(--text-subtle)]",
      },
      size: {
        xs: "h-6 px-2 text-[11px] rounded-[var(--radius-sm)] gap-1",
        sm: "h-8 px-3 text-xs rounded-[var(--radius-md)] gap-1.5",
        md: "h-9 px-4 text-sm rounded-[var(--radius-md)] gap-2",
        icon: "h-8 w-8 p-0 rounded-[var(--radius-md)]",
        "icon-xs": "h-6 w-6 p-0 rounded-[var(--radius-sm)]",
        "icon-md": "h-9 w-9 p-0 rounded-[var(--radius-md)]",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
