"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Moon,
  Sun,
  LayoutGrid,
  ListTodo,
  Activity,
  Code2,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (id: string) => void;
  onSelectView: (view: string) => void;
  onCreateIssue: () => void;
}

interface CommandItem {
  id: string;
  category: "Navigation" | "Projects" | "Actions" | "System";
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  shortcut?: string;
  badge?: string;
  action: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onSelectProject,
  onSelectView,
  onCreateIssue,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const items: CommandItem[] = React.useMemo(() => {
    return [
      {
        id: "create-issue",
        category: "Actions",
        title: "Create new issue",
        subtitle: "Capture a bug, task, or feature request",
        icon: Plus,
        shortcut: "C",
        action: () => {
          onClose();
          onCreateIssue();
        },
      },
      {
        id: "jump-issue-101",
        category: "Actions",
        title: "Jump to JREL-101",
        subtitle: "Scaffold Next.js 16 + Tailwind CSS design tokens",
        icon: ArrowRight,
        badge: "JREL-101",
        action: () => {
          onClose();
          onSelectView("board");
        },
      },
      {
        id: "jump-issue-102",
        category: "Actions",
        title: "Jump to JREL-102",
        subtitle: "PostgreSQL 15 container & Prisma schema setup",
        icon: ArrowRight,
        badge: "JREL-102",
        action: () => {
          onClose();
          onSelectView("board");
        },
      },
      {
        id: "view-board",
        category: "Navigation",
        title: "Go to Kanban Board",
        subtitle: "Active sprint column view",
        icon: LayoutGrid,
        shortcut: "G B",
        action: () => {
          onClose();
          onSelectView("board");
        },
      },
      {
        id: "view-issues",
        category: "Navigation",
        title: "Go to Issues List",
        subtitle: "Filterable table and backlog rows",
        icon: ListTodo,
        shortcut: "G I",
        action: () => {
          onClose();
          onSelectView("issues");
        },
      },
      {
        id: "view-activity",
        category: "Navigation",
        title: "Go to Activity Feed",
        subtitle: "Recent audit stream and updates",
        icon: Activity,
        shortcut: "G A",
        action: () => {
          onClose();
          onSelectView("activity");
        },
      },
      {
        id: "switch-jrel",
        category: "Projects",
        title: "Switch to Jrello Core",
        subtitle: "Identifier: JREL · 18 issues",
        icon: LayoutGrid,
        action: () => {
          onClose();
          onSelectProject("JREL");
        },
      },
      {
        id: "switch-api",
        category: "Projects",
        title: "Switch to Backend Engine",
        subtitle: "Identifier: API · 9 issues",
        icon: LayoutGrid,
        action: () => {
          onClose();
          onSelectProject("API");
        },
      },
      {
        id: "dev-gallery",
        category: "System",
        title: "Open Design System Gallery",
        subtitle: "Inspect tokens, type scale, buttons, badges at /dev",
        icon: Code2,
        action: () => {
          onClose();
          router.push("/dev");
        },
      },
      {
        id: "theme-toggle",
        category: "System",
        title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        subtitle: "Persisted preference (prefers-color-scheme)",
        icon: theme === "dark" ? Sun : Moon,
        action: () => {
          onClose();
          setTheme(theme === "dark" ? "light" : "dark");
        },
      },
    ];
  }, [onClose, onCreateIssue, onSelectProject, onSelectView, router, setTheme, theme]);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(lower)) ||
        (item.badge && item.badge.toLowerCase().includes(lower))
    );
  }, [items, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredItems.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-none transition-opacity duration-[var(--duration-fast)] select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center px-3.5 border-b border-[var(--border)] bg-[var(--bg-base)]">
          <Search className="h-4 w-4 text-[var(--text-subtle)] shrink-0 mr-2.5" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search issues (JREL-101)..."
            className="h-11 w-full bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-[var(--text-subtle)] hover:text-[var(--text)] px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 flex flex-col gap-0.5">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 rounded-[var(--radius-sm)] text-xs text-left transition-colors",
                    isSelected
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30"
                      : "text-[var(--text)] hover:bg-[var(--bg-overlay)] border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                      )}
                      strokeWidth={1.5}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[var(--text)] truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant="mono" size="sm" className="text-[10px] px-1 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.subtitle && (
                        <span className="text-[11px] text-[var(--text-subtle)] truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.shortcut && (
                    <kbd className="inline-flex h-5 items-center rounded border border-[var(--border)] bg-[var(--bg-overlay)] px-1.5 font-mono-id text-[10px] text-[var(--text-subtle)]">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-[var(--border)] bg-[var(--bg-base)] text-[11px] text-[var(--text-subtle)] font-mono-id">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Jrello Command Engine</span>
        </div>
      </div>
    </div>
  );
}
