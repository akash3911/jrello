"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Plus,
  Moon,
  Sun,
  CornerDownLeft,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import type { ShellContext } from "@/lib/types";

interface PaletteIssue {
  id: string;
  number: number;
  title: string;
  priority: string;
}

interface CommandItem {
  id: string;
  group: "Actions" | "Projects" | "Issues" | "System";
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  perform: () => void;
}

export function CommandPalette({
  onClose,
  context,
  onCreateIssue,
  onToggleShortcuts,
}: {
  onClose: () => void;
  context: ShellContext;
  onCreateIssue: () => void;
  onToggleShortcuts: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [results, setResults] = React.useState<PaletteIssue[]>([]);
  const [searching, setSearching] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const wsSlug = context.currentWorkspace.slug;

  // Debounced issue search against the API
  React.useEffect(() => {
    const term = query.trim();
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (term.length < 2 || /^[A-Za-z]+-\d+$/i.test(term)) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        // Search across every project the workspace has
        const searches = await Promise.all(
          context.projects.map((p) =>
            fetch(
              `/api/v1/workspaces/${wsSlug}/projects/${p.slug}/issues?search=${encodeURIComponent(term)}`
            ).then((r) => (r.ok ? r.json() : { issues: [] }))
          )
        );
        if (!cancelled) {
          const mapped: PaletteIssue[] = [];
          searches.forEach((res, idx) => {
            for (const i of res.issues ?? []) {
              mapped.push({
                id: `${context.projects[idx].key}-${i.number}`,
                number: i.number,
                title: i.title,
                priority: i.priority,
              });
            }
          });
          setResults(mapped.slice(0, 8));
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, context.projects, wsSlug]);

  const commands = React.useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      {
        id: "create-issue",
        group: "Actions",
        title: "Create new issue",
        icon: Plus,
        perform: () => {
          onClose();
          onCreateIssue();
        },
      },
      ...context.projects.map((p) => ({
        id: `project-${p.id}`,
        group: "Projects" as const,
        title: p.name,
        subtitle: `Board · ${p.issueCount} issues`,
        badge: p.key,
        perform: () => {
          onClose();
          router.push(`/${wsSlug}/projects/${p.slug}`);
        },
      })),
      ...(context.projects.length > 0
        ? [
            {
              id: "project-settings",
              group: "System" as const,
              title: `Open ${context.projects[0].name} settings`,
              subtitle: "Manage name, description and members",
              icon: Settings,
              perform: () => {
                onClose();
                router.push(
                  `/${wsSlug}/projects/${context.projects[0].slug}/settings`
                );
              },
            },
          ]
        : []),
      {
        id: "new-workspace",
        group: "System",
        title: "Create a new workspace",
        subtitle: "Guided onboarding wizard",
        perform: () => {
          onClose();
          router.push("/onboarding");
        },
      },
      {
        id: "shortcuts",
        group: "System",
        title: "Show keyboard shortcuts",
        subtitle: "? at any time",
        perform: () => {
          onClose();
          onToggleShortcuts();
        },
      },
      {
        id: "theme",
        group: "System",
        title: resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        perform: () => {
          onClose();
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
        },
      },
    ];
    return items;
  }, [context.projects, wsSlug, onClose, onCreateIssue, onToggleShortcuts, router, resolvedTheme, setTheme]);

  // Direct issue-key jump e.g. CORE-42
  const directKey = query.trim().match(/^([A-Za-z][A-Za-z0-9]*)-(\d+)$/);

  const filteredCommands = React.useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower || directKey) return commands;
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.subtitle?.toLowerCase().includes(lower) ||
        c.badge?.toLowerCase().includes(lower)
    );
  }, [commands, query, directKey]);

  type Row =
    | { kind: "command"; item: CommandItem }
    | { kind: "issue"; issue: PaletteIssue };

  const rows = React.useMemo<Row[]>(() => {
    const out: Row[] = [];
    if (directKey) {
      out.push({
        kind: "issue",
        issue: {
          id: directKey[0].toUpperCase(),
          number: Number(directKey[2]),
          title: `Jump to ${directKey[0].toUpperCase()}-${directKey[1]}`,
          priority: "NONE",
        },
      });
    }
    for (const c of filteredCommands) out.push({ kind: "command", item: c });
    for (const r of results) out.push({ kind: "issue", issue: r });
    return out.slice(0, 12);
  }, [filteredCommands, results, directKey]);

  const safeIndex = Math.min(selectedIndex, Math.max(0, rows.length - 1));

  const runRow = (row: Row) => {
    if (row.kind === "command") {
      row.item.perform();
      return;
    }
    onClose();
    router.push(`/${wsSlug}/issue/${row.issue.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && rows[safeIndex]) {
      e.preventDefault();
      runRow(rows[safeIndex]);
    }
  };

  let lastGroup: string | null = null;

  return (
    <div
      className="fixed inset-0 z-50 flex select-none items-start justify-center bg-black/50 pt-[14vh] animate-overlay-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-[var(--border)] bg-[var(--bg-base)] px-3.5">
          <Search className="mr-2.5 h-4 w-4 shrink-0 text-[var(--text-subtle)]" strokeWidth={1.5} />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search issues, jump to a key like CORE-12…"
            className="h-11 w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)]"
          />
          {searching && (
            <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">searching…</span>
          )}
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-1.5">
          {rows.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--text-muted)]">
              No matches for “{query}”.
            </div>
          ) : (
            rows.map((row, index) => {
              const isSelected = index === safeIndex;
              const groupLabel =
                row.kind === "command" ? row.item.group : "Issues";
              const showGroup = groupLabel !== lastGroup;
              lastGroup = groupLabel;

              return (
                <React.Fragment key={row.kind === "command" ? row.item.id : `issue-${row.issue.id}`}>
                  {showGroup && (
                    <p className="px-2 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                      {groupLabel}
                    </p>
                  )}
                  <button
                    onClick={() => runRow(row)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-transparent px-2.5 py-2 text-left text-xs transition-colors",
                      isSelected
                        ? "border-[var(--accent)]/25 bg-[var(--accent-soft)]"
                        : "hover:bg-[var(--bg-overlay)]"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {row.kind === "command" && row.item.icon && (
                        <row.item.icon
                          className={cn("h-4 w-4 shrink-0", isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]")}
                          strokeWidth={1.5}
                        />
                      )}
                      <Badge variant="mono" size="xs">
                        {row.kind === "issue" ? row.issue.id : row.item.badge ?? "•"}
                      </Badge>
                      <span className="truncate font-medium text-[var(--text)]">
                        {row.kind === "issue" ? row.issue.title : row.item.title}
                      </span>
                      {row.kind === "issue" && (
                        <PriorityBadge priority={row.issue.priority as never} size="sm" />
                      )}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-[var(--text-subtle)]" />
                    )}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2 font-mono-id text-[10px] text-[var(--text-subtle)]">
          <div className="flex gap-3">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
          <span>{context.currentWorkspace.name}</span>
        </div>
      </div>
    </div>
  );
}
