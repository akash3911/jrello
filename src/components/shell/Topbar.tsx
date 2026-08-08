"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Moon,
  Sun,
  HelpCircle,
  Code2,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export interface TopbarProps {
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onCreateIssue: () => void;
  currentProject: string;
  activeView: string;
}

const onlineMembers = [
  { name: "Alex Mercer", fallback: "AM", src: null, color: "border-[var(--accent)]" },
  { name: "Sarah Chen", fallback: "SC", src: null, color: "border-[var(--success)]" },
  { name: "Marcus Brody", fallback: "MB", src: null, color: "border-[var(--palette-purple)]" },
];

function useIsMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Topbar({
  onOpenCommandPalette,
  onOpenShortcuts,
  onCreateIssue,
  currentProject,
  activeView,
}: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)] px-4 select-none z-20">
      {/* Left: Breadcrumbs & Project Indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-[var(--text)]">Acme Software</span>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--text-subtle)]" strokeWidth={1.5} />
        <span className="font-mono-id px-1.5 py-0.5 rounded bg-[var(--bg-overlay)] border border-[var(--border)] font-semibold text-[var(--text)]">
          {currentProject}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--text-subtle)]" strokeWidth={1.5} />
        <span className="capitalize text-[var(--text-muted)] font-medium">
          {activeView}
        </span>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="flex h-8 w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] px-3 text-xs text-[var(--text-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors focus-ring"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Search or jump to...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="inline-flex h-4 items-center rounded border border-[var(--border)] bg-[var(--bg-overlay)] px-1 font-mono-id text-[10px] text-[var(--text-subtle)]">
              ⌘K
            </kbd>
            <kbd className="inline-flex h-4 items-center rounded border border-[var(--border)] bg-[var(--bg-overlay)] px-1 font-mono-id text-[10px] text-[var(--text-subtle)]">
              /
            </kbd>
          </div>
        </button>
      </div>

      {/* Right: Actions, Presence, Theme, Dev & Profile */}
      <div className="flex items-center gap-2">
        {/* Create Issue Action Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onCreateIssue}
          className="gap-1 text-xs"
          title="Create Issue (C)"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden md:inline">Create Issue</span>
          <kbd className="hidden md:inline-flex h-4 items-center rounded bg-black/20 px-1 font-mono-id text-[9px] text-[var(--accent-fg)] ml-1">
            C
          </kbd>
        </Button>

        {/* Presence Avatars */}
        <div className="hidden lg:flex items-center -space-x-1.5 ml-1 mr-1">
          {onlineMembers.map((member) => (
            <div key={member.name} className="relative group" title={`${member.name} (online)`}>
              <Avatar
                fallback={member.fallback}
                size="sm"
                className="ring-2 ring-[var(--bg-base)] cursor-default"
              />
              <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-[var(--success)] ring-1 ring-[var(--bg-base)]" />
            </div>
          ))}
          <div className="pl-3 text-[11px] font-mono-id text-[var(--text-subtle)]">
            3 live
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border)] mx-0.5 hidden sm:block" />

        {/* Dev Component Gallery Link */}
        <Link href="/dev">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--accent)]"
            title="Design System & Component Gallery (/dev)"
          >
            <Code2 className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </Link>

        {/* Keyboard Shortcuts Overlay Trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenShortcuts}
          className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text)]"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
        </Button>

        {/* Theme Toggle Button */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text)]"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-[var(--warning)]" strokeWidth={1.5} />
            ) : (
              <Moon className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
            )}
          </Button>
        )}

        {/* User Avatar */}
        <div className="ml-1">
          <Avatar fallback="AK" size="sm" className="bg-[var(--accent-soft)] text-[var(--accent)] font-semibold cursor-pointer" />
        </div>
      </div>
    </header>
  );
}
