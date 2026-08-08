"use client";

import * as React from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ShortcutsModal } from "@/components/shell/ShortcutsModal";
import { CreateIssueModal } from "@/components/board/CreateIssueModal";
import { PriorityLevel } from "@/components/ui/priority-badge";
import { StatusKind } from "@/components/ui/status-badge";

export interface IssueCreatePayload {
  title: string;
  description: string;
  status: StatusKind;
  priority: PriorityLevel;
  estimate: string;
}

export interface AppShellProps {
  children?: React.ReactNode;
  onCreateIssueSubmit?: (issueData: IssueCreatePayload) => void;
}

export function AppShell({ children, onCreateIssueSubmit }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [activeView, setActiveView] = React.useState("board");
  const [currentProject, setCurrentProject] = React.useState("JREL");
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = React.useState(false);
  const [createIssueModalOpen, setCreateIssueModalOpen] = React.useState(false);

  // Responsive breakpoint handling for 1024px-1279px (laptop default collapsed)
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 1280) {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Global keyboard shortcuts per UX.md
  React.useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput =
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Cmd+K or Ctrl+K or / (when not typing)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (!isInput && e.key === "/") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (!isInput && (e.key === "[" || e.key === "]")) {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
        return;
      }

      if (!isInput && e.key === "?") {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      if (!isInput && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setCreateIssueModalOpen(true);
        return;
      }

      // 'G' sequence shortcuts
      const now = Date.now();
      if (!isInput && (e.key === "g" || e.key === "G")) {
        lastKey = "g";
        lastKeyTime = now;
      } else if (!isInput && lastKey === "g" && now - lastKeyTime < 1000) {
        if (e.key === "b" || e.key === "B") {
          e.preventDefault();
          setActiveView("board");
        } else if (e.key === "i" || e.key === "I") {
          e.preventDefault();
          setActiveView("issues");
        } else if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          setActiveView("activity");
        }
        lastKey = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text)]">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        activeView={activeView}
        onSelectView={setActiveView}
        currentProject={currentProject}
        onSelectProject={setCurrentProject}
      />

      {/* Main Content View with Topbar */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
          onCreateIssue={() => setCreateIssueModalOpen(true)}
          currentProject={currentProject}
          activeView={activeView}
        />

        <main className="flex-1 overflow-auto bg-[var(--bg-base)]">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectProject={setCurrentProject}
        onSelectView={setActiveView}
        onCreateIssue={() => setCreateIssueModalOpen(true)}
      />

      <ShortcutsModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <CreateIssueModal
        open={createIssueModalOpen}
        onClose={() => setCreateIssueModalOpen(false)}
        onCreate={(newIssue) => {
          if (onCreateIssueSubmit) {
            onCreateIssueSubmit(newIssue);
          }
        }}
        projectPrefix={currentProject}
      />
    </div>
  );
}
