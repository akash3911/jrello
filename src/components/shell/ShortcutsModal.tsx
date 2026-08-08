"use client";

import * as React from "react";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: "C", description: "Create new issue (opens quick composer)", category: "Creation" },
  { key: "⌘ K or /", description: "Open Command Palette / global search", category: "Navigation" },
  { key: "G then B", description: "Jump directly to Board view", category: "Navigation" },
  { key: "G then I", description: "Jump directly to Issues list", category: "Navigation" },
  { key: "G then A", description: "Jump directly to Activity feed", category: "Navigation" },
  { key: "[ or ]", description: "Toggle sidebar collapse state", category: "Navigation" },
  { key: "J / K", description: "Navigate next / previous card in list or board", category: "Selection" },
  { key: "Enter / Space", description: "Open selected issue detail panel", category: "Selection" },
  { key: "Esc", description: "Close modal, slide-over panel, or clear focus", category: "System" },
  { key: "?", description: "Toggle this keyboard shortcuts cheat-sheet", category: "System" },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none transition-opacity select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-base)]">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Keyboard Shortcuts
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-[var(--text-subtle)] hover:text-[var(--text)]"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 max-h-96 overflow-y-auto flex flex-col gap-2">
          {shortcuts.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-overlay)] transition-colors text-xs"
            >
              <span className="text-[var(--text)] font-medium">
                {item.description}
              </span>
              <kbd className="inline-flex h-5 items-center rounded border border-[var(--border)] bg-[var(--bg-base)] px-2 font-mono-id text-[11px] font-semibold text-[var(--accent)]">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-base)] text-[11px] text-[var(--text-subtle)] flex items-center justify-between font-mono-id">
          <span>Keyboard-first, mouse-complete (UX.md §1)</span>
          <Button variant="secondary" size="sm" onClick={onClose} className="h-6 px-2 text-[11px]">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
