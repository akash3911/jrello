import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "2xs" | "xs" | "sm" | "md" | "lg";
}

const sizeClasses = {
  "2xs": "h-4 w-4 text-[8px]",
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({
  src,
  alt = "User avatar",
  fallback = "U",
  size = "sm",
  className,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-gradient-to-br from-[var(--bg-overlay)] to-[var(--bg-inset)] font-semibold select-none",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="leading-none text-[var(--text-muted)]">
          {fallback.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
