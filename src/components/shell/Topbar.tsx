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
import { NotificationInbox } from "@/components/shell/NotificationInbox";

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
        <div className="flex items-center gap-1.5 font-medium text-[var(--text)]">
          <span className="flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-[10px] font-mono-id font-bold text-[var(--accent-fg)]">
            {currentProject.slice(0, 2)}
          </span>
          <span className="tracking-tight">{currentProject} Workspace</span>
        </div>

        <ChevronRight className="h-3.5 w-3.5 text-[var(--text-subtle)]" />

        <span className="font-mono-id text-[var(--text-muted)] capitalize">
          {activeView}
        </span>
      </div>

      {/* Center: Command Palette Trigger Button */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center justify-between w-64 md:w-80 h-8 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)] text-xs text-[var(--text-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors focus-ring"
        title="Open Command Palette (Cmd+K / Ctrl+K)"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Search issues, jump to view...</span>
        </div>
        <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded-[2px] border border-[var(--border)] bg-[var(--bg-base)] px-1 font-mono-id text-[10px] text-[var(--text-subtle)]">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Right: Actions, Live Avatars, Notifications, Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Quick Issue Create Button (C) */}
        <Button
          variant="primary"
          size="sm"
          onClick={onCreateIssue}
          className="h-7 text-xs gap-1 shadow-[var(--shadow-sm)]"
          title="Create Issue (C)"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">New Issue</span>
          <kbd className="hidden md:inline-block ml-1 font-mono-id text-[9px] opacity-70">C</kbd>
        </Button>

        {/* Live Presence Avatars in Topbar */}
        <div className="hidden lg:flex items-center -space-x-1.5 overflow-hidden pl-2">
          {onlineMembers.map((member) => (
            <div
              key={member.name}
              title={`${member.name} is viewing`}
              className={`relative rounded-full border-2 ${member.color} ring-1 ring-[var(--bg-base)] transition-transform hover:scale-110 hover:z-10`}
            >
              <Avatar fallback={member.fallback} size="xs" />
              <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-[var(--success)] ring-1 ring-[var(--bg-base)]" />
            </div>
          ))}
          <div className="pl-3 text-[11px] font-mono-id text-[var(--text-subtle)]">
            3 live
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border)] mx-0.5 hidden sm:block" />

        {/* Notification Inbox Drawer */}
        <NotificationInbox />

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
