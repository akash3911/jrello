"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ShortcutsModal } from "@/components/shell/ShortcutsModal";
import { CreateIssueModal } from "@/components/board/CreateIssueModal";
import type { ShellContext } from "@/lib/types";

export interface AppShellProps {
  context: ShellContext;
  children: React.ReactNode;
}

export function AppShell({ context, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [createIssueOpen, setCreateIssueOpen] = React.useState(false);

  // Derive the active project slug from /{ws}/projects/{slug}/...
  const activeProject = React.useMemo(() => {
    if (!pathname) return null;
    const segments = pathname.split("/").filter(Boolean);
    const idx = segments.indexOf("projects");
    if (idx === -1 || !segments[idx + 1]) return null;
    return context.projects.find((p) => p.slug === segments[idx + 1]) ?? null;
  }, [pathname, context.projects]);

  const activeView = React.useMemo(() => {
    if (!pathname) return "board";
    const segments = pathname.split("/").filter(Boolean);
    if (!activeProject) return segments.length <= 1 ? "overview" : "overview";
    const after = segments[segments.indexOf("projects") + 2];
    return after ?? "board";
  }, [pathname, activeProject]);

  // Responsive default: collapse between 1024–1279px
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (max-width: 1279px)");
    const apply = () => {
      if (mq.matches) setSidebarCollapsed(true);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // Global keyboard shortcuts
  React.useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement | null;
      const isTyping =
        !!target &&
        ((target.tagName.toLowerCase() === "input") ||
          target.tagName.toLowerCase() === "textarea" ||
          target.tagName.toLowerCase() === "select" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
        return;
      }

      if (isTyping) return;

      switch (e.key) {
        case "/":
          e.preventDefault();
          setCommandPaletteOpen(true);
          return;
        case "[":
        case "]":
          e.preventDefault();
          setSidebarCollapsed((v) => !v);
          return;
        case "?":
          e.preventDefault();
          setShortcutsOpen((v) => !v);
          return;
        case "c":
        case "C":
          e.preventDefault();
          setCreateIssueOpen(true);
          return;
      }

      // G-chords: g then b/i/s/a
      const now = Date.now();
      if (e.key.toLowerCase() === "g") {
        lastKey = "g";
        lastKeyTime = now;
        return;
      }
      if (lastKey === "g" && now - lastKeyTime < 1000) {
        lastKey = "";
        if (activeProject) {
          const ws = context.currentWorkspace.slug;
          const base = `/${ws}/projects/${activeProject.slug}`;
          switch (e.key.toLowerCase()) {
            case "b":
              e.preventDefault();
              router.push(base);
              break;
            case "i":
              e.preventDefault();
              router.push(`${base}/issues`);
              break;
            case "s":
              e.preventDefault();
              router.push(`${base}/sprints`);
              break;
            case "a":
              e.preventDefault();
              router.push(`${base}/settings`);
              break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, context.currentWorkspace.slug, activeProject]);

  const handleIssueCreated = React.useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text)]">
      <Sidebar
        context={context}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        activeProject={activeProject}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          context={context}
          activeProject={activeProject}
          activeView={activeView}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onCreateIssue={() => setCreateIssueOpen(true)}
        />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {commandPaletteOpen && (
        <CommandPalette
          onClose={() => setCommandPaletteOpen(false)}
          context={context}
          onCreateIssue={() => setCreateIssueOpen(true)}
          onToggleShortcuts={() => setShortcutsOpen(true)}
        />
      )}

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <CreateIssueModal
        open={createIssueOpen}
        onClose={() => setCreateIssueOpen(false)}
        onCreated={handleIssueCreated}
        context={context}
        defaultProject={activeProject}
      />
    </div>
  );
}
