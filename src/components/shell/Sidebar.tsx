"use client";

import * as React from "react";
import {
  LayoutGrid,
  ListTodo,
  Milestone,
  Activity,
  Users,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeView: string;
  onSelectView: (view: string) => void;
  currentProject: string;
  onSelectProject: (projectId: string) => void;
}

const projects = [
  { id: "JREL", name: "Jrello Core", prefix: "JREL", count: 18, color: "text-[var(--accent)]" },
  { id: "API", name: "Backend Engine", prefix: "API", count: 9, color: "text-[var(--palette-purple)]" },
  { id: "CLI", name: "Developer CLI", prefix: "CLI", count: 4, color: "text-[var(--palette-orange)]" },
];

const navigationItems = [
  { id: "board", label: "Board", icon: LayoutGrid, shortcut: "G B" },
  { id: "issues", label: "Issues", icon: ListTodo, shortcut: "G I" },
  { id: "sprints", label: "Sprints", icon: Milestone, badge: "Phase 5" },
  { id: "activity", label: "Activity", icon: Activity, shortcut: "G A" },
  { id: "members", label: "Members", icon: Users, count: 6 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeView,
  onSelectView,
  currentProject,
  onSelectProject,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col shrink-0 border-r border-[var(--border)] bg-[var(--bg-raised)] transition-all duration-[var(--duration-normal)] select-none z-30",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Workspace Switcher Header */}
      <div className="flex h-12 items-center justify-between px-3 border-b border-[var(--border)]">
        {!collapsed ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-xs shrink-0">
              JR
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[var(--text)] truncate leading-tight">
                Acme Software
              </span>
              <span className="text-[11px] text-[var(--text-subtle)] font-mono-id leading-tight truncate">
                acme-eng
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-xs mx-auto">
            JR
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-7 w-7 text-[var(--text-muted)] hover:text-[var(--text)]"
          title={collapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
          )}
        </Button>
      </div>

      {/* Projects List */}
      <div className="flex flex-col py-3 px-2 border-b border-[var(--border)]">
        {!collapsed && (
          <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">
            <span>Projects</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-[var(--text-subtle)] hover:text-[var(--text)]"
              title="Create new project"
            >
              <Plus className="h-3 w-3" strokeWidth={1.5} />
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {projects.map((project) => {
            const isActive = currentProject === project.id;
            return (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                title={`${project.name} (${project.prefix})`}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors group text-left",
                  isActive
                    ? "bg-[var(--bg-overlay)] text-[var(--text)] font-medium border border-[var(--border)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]/60 hover:text-[var(--text)] border border-transparent"
                )}
              >
                <span
                  className={cn(
                    "font-mono-id text-[11px] font-bold shrink-0 w-8 px-1 py-0.5 text-center rounded bg-[var(--bg-base)] border border-[var(--border)]",
                    project.color
                  )}
                >
                  {project.prefix}
                </span>

                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{project.name}</span>
                    <span className="text-[11px] font-mono-id text-[var(--text-subtle)]">
                      {project.count}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navigation Views */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 mb-1.5 text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">
            Views
          </div>
        )}

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              title={item.label}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors group text-left",
                isActive
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium border border-[var(--accent)]/20"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text)] border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text)]"
                )}
                strokeWidth={1.5}
              />

              {!collapsed && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-[10px] font-mono-id text-[var(--text-subtle)] opacity-60">
                      {item.shortcut}
                    </span>
                  )}
                  {item.badge && (
                    <Badge variant="default" size="sm" className="text-[10px] px-1 py-0 h-4">
                      {item.badge}
                    </Badge>
                  )}
                  {item.count && (
                    <span className="text-[11px] font-mono-id text-[var(--text-subtle)]">
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status / Footer */}
      <div className="p-2 border-t border-[var(--border)] bg-[var(--bg-base)]">
        {!collapsed ? (
          <div className="flex flex-col gap-1.5 p-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-raised)]">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[var(--success)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                <span className="font-mono-id text-[var(--text)]">Postgres 15 (WSL)</span>
              </div>
              <Badge variant="success" size="sm" className="h-4 px-1 text-[9px]">
                LIVE
              </Badge>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--text-subtle)]">
              <span>Jrello v0.1.0</span>
              <span className="font-mono-id">Phase 1</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-1" title="PostgreSQL 15 Container Connected">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
          </div>
        )}
      </div>
    </aside>
  );
}
