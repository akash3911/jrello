"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Plus,
  Moon,
  Sun,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { NotificationInbox } from "@/components/shell/NotificationInbox";
import type { ShellContext, ProjectSummaryClient } from "@/lib/types";

function useIsMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

interface TopbarProps {
  context: ShellContext;
  activeProject: ProjectSummaryClient | null;
  activeView: string;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onCreateIssue: () => void;
}

const VIEW_LABELS: Record<string, string> = {
  board: "Board",
  issues: "Issues",
  sprints: "Sprints",
  reports: "Reports",
  settings: "Settings",
};

export function Topbar({
  context,
  activeProject,
  activeView,
  onOpenCommandPalette,
  onOpenShortcuts,
  onCreateIssue,
}: TopbarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const wsSlug = context.currentWorkspace.slug;
  const issueMatch = pathname?.match(/\/issue\/([A-Za-z0-9]+-\d+)/);

  return (
    <header className="z-20 flex h-12 w-full select-none items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)] px-4">
      {/* Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-1.5 text-xs">
        <Link
          href={`/${wsSlug}`}
          className="font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)]"
        >
          {context.currentWorkspace.name}
        </Link>

        {activeProject && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-subtle)]" />
            <Link
              href={`/${wsSlug}/projects/${activeProject.slug}`}
              className="truncate font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)]"
            >
              {activeProject.name}
            </Link>
            <span className="hidden rounded border border-[var(--border)] bg-[var(--bg-inset)] px-1 py-px font-mono-id text-[9px] font-bold text-[var(--accent)] sm:inline">
              {activeProject.key}
            </span>
          </>
        )}

        {(activeProject || issueMatch) && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-subtle)]" />
            <span className="font-mono-id text-[var(--text-muted)]">
              {issueMatch ? issueMatch[1] : VIEW_LABELS[activeView] ?? activeView}
            </span>
          </>
        )}
      </div>

      {/* Command palette trigger */}
      <button
        onClick={onOpenCommandPalette}
        title="Command palette (⌘K)"
        className="hidden h-8 w-72 items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 text-xs text-[var(--text-subtle)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] focus-ring md:flex lg:w-80"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Search or jump to…</span>
        </span>
        <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--bg-base)] px-1 font-mono-id text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="primary"
          size="sm"
          onClick={onCreateIssue}
          title="New issue (C)"
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">New Issue</span>
          <kbd className="ml-0.5 hidden font-mono-id text-[9px] opacity-60 md:inline">C</kbd>
        </Button>

        <div className="mx-1 hidden h-4 w-px bg-[var(--border)] sm:block" />

        {/* Mobile command palette */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenCommandPalette}
          className="md:hidden"
          title="Search (⌘K)"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
        </Button>

        <NotificationInbox workspaceSlug={wsSlug} />

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
        </Button>

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-[var(--warning)]" strokeWidth={1.5} />
            ) : (
              <Moon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
            )}
          </Button>
        )}

        {/* Account */}
        {clerkEnabled ? (
          <div className="ml-1 scale-90">
            <UserButton />
          </div>
        ) : (
          <div
            title={`${context.currentUser.name ?? "Local developer"} · local dev mode`}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--palette-purple)] font-semibold text-white"
          >
            {(context.currentUser.name ?? "L")
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
