"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  ListTodo,
  Milestone,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ShellContext, ProjectSummaryClient } from "@/lib/types";

interface SidebarProps {
  context: ShellContext;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeProject: ProjectSummaryClient | null;
}

export function Sidebar({
  context,
  collapsed,
  onToggleCollapse,
  activeProject,
}: SidebarProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const ws = context.currentWorkspace;

  const projectBase = activeProject ? `/${ws.slug}/projects/${activeProject.slug}` : null;

  const views = [
    ...(projectBase
      ? [
          { href: projectBase, label: "Board", icon: LayoutGrid, chord: "G B" },
          { href: `${projectBase}/issues`, label: "Issues", icon: ListTodo, chord: "G I" },
          { href: `${projectBase}/sprints`, label: "Sprints", icon: Milestone, chord: "G S" },
          { href: `${projectBase}/settings`, label: "Settings", icon: Settings, chord: "G A" },
        ]
      : []),
  ];

  const switchWorkspace = (slug: string) => {
    setSwitcherOpen(false);
    router.push(`/${slug}`);
  };

  return (
    <aside
      className={cn(
        "relative z-30 flex shrink-0 select-none flex-col border-r border-[var(--border)] bg-[var(--bg-raised)] transition-all duration-[var(--duration-normal)]",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Workspace switcher */}
      <div className="relative flex h-12 items-center justify-between border-b border-[var(--border)] px-2.5">
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          title="Switch workspace"
          className={cn(
            "flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] p-1 text-left transition-colors hover:bg-[var(--bg-overlay)]",
            collapsed && "mx-auto"
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--accent)] to-[var(--palette-purple)] text-[11px] font-bold text-white shadow-[var(--shadow-xs)]">
            {ws.name.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-xs font-semibold text-[var(--text)]">
                  {ws.name}
                </span>
                <span className="truncate font-mono-id text-[10px] text-[var(--text-subtle)]">
                  /{ws.slug}
                </span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-subtle)]" />
            </>
          )}
        </button>

        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleCollapse}
            title="Collapse sidebar ([)"
            className="text-[var(--text-subtle)] hover:text-[var(--text)]"
          >
            <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        )}

        {/* Workspace dropdown */}
        {switcherOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setSwitcherOpen(false)}
            />
            <div className="absolute left-2 top-12 z-50 mt-1 w-64 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] animate-modal-in">
              <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Workspaces
              </p>
              {context.workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => switchWorkspace(w.slug)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--bg-overlay)]",
                    w.slug === ws.slug && "bg-[var(--accent-soft)]/50"
                  )}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[var(--accent)] to-[var(--palette-purple)] text-[10px] font-bold text-white">
                    {w.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[var(--text)]">
                      {w.name}
                    </span>
                    <span className="block truncate font-mono-id text-[10px] text-[var(--text-subtle)]">
                      {w.projectCount} {w.projectCount === 1 ? "project" : "projects"}
                    </span>
                  </span>
                  {w.role === "OWNER" && (
                    <span className="font-mono-id text-[9px] uppercase text-[var(--accent)]">
                      owner
                    </span>
                  )}
                </button>
              ))}
              <div className="border-t border-[var(--border)] p-1.5">
                <Link href="/onboarding" onClick={() => setSwitcherOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs">
                    <Plus className="h-3.5 w-3.5" /> New workspace
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {collapsed && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleCollapse}
          title="Expand sidebar ([)"
          className="mx-auto mt-2 text-[var(--text-subtle)] hover:text-[var(--text)]"
        >
          <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      )}

      {/* Projects */}
      <div className="border-b border-[var(--border)] px-2 py-3">
        {!collapsed && (
          <div className="mb-1.5 flex items-center justify-between px-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
              Projects
            </span>
            <Link href="/onboarding" title="Create project">
              <Plus className="h-3.5 w-3.5 cursor-pointer text-[var(--text-subtle)] transition-colors hover:text-[var(--text)]" />
            </Link>
          </div>
        )}
        <nav className="flex flex-col gap-0.5">
          {context.projects.length === 0 && !collapsed && (
            <p className="px-2 py-1 text-[11px] leading-snug text-[var(--text-subtle)]">
              No projects yet.
            </p>
          )}
          {context.projects.map((project) => {
            const isActive = activeProject?.id === project.id;
            return (
              <Link
                key={project.id}
                href={`/${ws.slug}/projects/${project.slug}`}
                title={`${project.name} (${project.key})`}
                className={cn(
                  "group flex items-center gap-2 rounded-[var(--radius-sm)] border border-transparent px-2 py-1.5 text-left text-xs transition-colors",
                  isActive
                    ? "border-[var(--border)] bg-[var(--bg-inset)] font-medium text-[var(--text)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]/70 hover:text-[var(--text)]"
                )}
              >
                <span
                  className={cn(
                    "w-8 shrink-0 rounded border border-[var(--border)] bg-[var(--bg-base)] px-1 py-0.5 text-center font-mono-id text-[10px] font-bold",
                    isActive ? "text-[var(--accent)]" : "text-[var(--text-subtle)]"
                  )}
                >
                  {project.key.slice(0, 4)}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{project.name}</span>
                    <span className="font-mono-id text-[10px] text-[var(--text-subtle)] opacity-0 transition-opacity group-hover:opacity-100">
                      {project.issueCount}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Views for the active project */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {!collapsed && (
          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
            {activeProject ? activeProject.key : "Views"}
          </div>
        )}
        {views.length === 0 && !collapsed && (
          <div className="mx-1 rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] p-2.5 text-center">
            <Layers className="mx-auto h-4 w-4 text-[var(--text-subtle)]" />
            <p className="mt-1.5 text-[11px] leading-snug text-[var(--text-subtle)]">
              Open a project to see its board, issues and sprints.
            </p>
          </div>
        )}
        {views.map((item) => {
          const isActive = item.href === projectBase
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-transparent px-2.5 py-1.5 text-left text-xs transition-colors",
                isActive
                  ? "border-[var(--accent)]/20 bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text)]"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.chord && (
                    <span className="font-mono-id text-[9px] text-[var(--text-subtle)] opacity-60">
                      {item.chord}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-2">
        {!collapsed ? (
          <div className="flex items-center justify-between px-2 py-1 text-[10px] text-[var(--text-subtle)]">
            <span className="font-mono-id">Jrello v1.0</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--success)]" />
              online
            </span>
          </div>
        ) : (
          <div className="flex justify-center py-1" title="All systems operational">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
          </div>
        )}
      </div>
    </aside>
  );
}
