"use client";

import * as React from "react";
import { Sparkles, AlertCircle } from "lucide-react";

export interface Toast {
  id: number;
  text: string;
  type: "success" | "error";
}

export function useToasts() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const counter = React.useRef(0);

  const push = React.useCallback((text: string, type: "success" | "error" = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return { toasts, push };
}

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-[var(--radius-md)] border px-3.5 py-2 text-xs font-medium shadow-[var(--shadow-md)] animate-toast-in ${
            t.type === "error"
              ? "border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--danger-fg)]"
              : "border-[var(--border-strong)] bg-[var(--bg-raised)] text-[var(--text)]"
          }`}
        >
          {t.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-[var(--danger)]" />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          )}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
