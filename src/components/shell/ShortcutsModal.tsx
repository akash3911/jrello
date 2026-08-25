"use client";

import * as React from "react";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const shortcuts: { key: string; description: string; category: string }[] = [
  { key: "C", description: "Create new issue", category: "Create" },
  { key: "⌘ K / /", description: "Open command palette & search", category: "Navigate" },
  { key: "G B", description: "Go to board", category: "Navigate" },
  { key: "G I", description: "Go to issues list", category: "Navigate" },
  { key: "G S", description: "Go to sprints", category: "Navigate" },
  { key: "G A", description: "Go to settings", category: "Navigate" },
  { key: "[ / ]", description: "Toggle sidebar", category: "Navigate" },
  { key: "J / K or ↓ / ↑", description: "Move focus down / up", category: "Select" },
  { key: "H / L or ← / →", description: "Move focus between columns", category: "Select" },
  { key: "Enter", description: "Open focused issue", category: "Select" },
  { key: "Esc", description: "Close panel, modal or composer", category: "System" },
  { key: "?", description: "Toggle this cheat-sheet", category: "System" },
];

const categories = [...new Set(shortcuts.map((s) => s.category))];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex select-none items-center justify-center bg-black/50 p-4 animate-overlay-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)] px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Keyboard className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
            Keyboard Shortcuts
          </span>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3">
          {categories.map((cat) => (
            <div key={cat} className="mb-2">
              <p className="px-1 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                {cat}
              </p>
              {shortcuts
                .filter((s) => s.category === cat)
                .map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-xs transition-colors hover:bg-[var(--bg-overlay)]"
                  >
                    <span className="font-medium text-[var(--text)]">{item.description}</span>
                    <kbd className="inline-flex h-5 items-center rounded border border-[var(--border)] bg-[var(--bg-base)] px-2 font-mono-id text-[10px] font-semibold text-[var(--accent)]">
                      {item.key}
                    </kbd>
                  </div>
                ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg-base)] px-4 py-2.5 font-mono-id text-[10px] text-[var(--text-subtle)]">
          <span>Keyboard-first, mouse-complete</span>
          <Button variant="secondary" size="xs" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
