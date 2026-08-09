"use client";

import * as React from "react";
import { Bell, Sparkles, User, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface NotificationItem {
  id: string;
  type: "ASSIGNED" | "MENTIONED" | "COMMENTED" | "STATUS_CHANGED";
  issueKey?: string;
  title: string;
  actorName: string;
  readAt: string | Date | null;
  createdAt: string;
}

export function NotificationInbox() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    {
      id: "n-1",
      type: "STATUS_CHANGED",
      issueKey: "JREL-101",
      title: "Auto-moved to Done on PR #12 merge",
      actorName: "GitHub Bot",
      readAt: null,
      createdAt: "5m ago",
    },
    {
      id: "n-2",
      type: "ASSIGNED",
      issueKey: "JREL-104",
      title: "Assigned you to implement sprint reporting",
      actorName: "Sarah Chen",
      readAt: null,
      createdAt: "1h ago",
    },
    {
      id: "n-3",
      type: "COMMENTED",
      issueKey: "JREL-102",
      title: "Left a comment on Clerk auth proxy routing",
      actorName: "Alex Mercer",
      readAt: new Date().toISOString(),
      createdAt: "3h ago",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    );
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "STATUS_CHANGED":
        return <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />;
      case "ASSIGNED":
        return <User className="h-3.5 w-3.5 text-[var(--success)]" />;
      case "COMMENTED":
      case "MENTIONED":
        return <MessageSquare className="h-3.5 w-3.5 text-[var(--purple-fg)]" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-[var(--radius-sm)] text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--bg-overlay)] transition-colors focus-ring"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50 w-80 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] flex flex-col animate-in fade-in slide-in-from-top-2 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-base)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text)]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <Badge variant="accent" size="sm">
                    {unreadCount} new
                  </Badge>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-[var(--accent)] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-[var(--border)]/50 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-subtle)] font-mono-id">
                  Inbox zero. No new notifications.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markRead(item.id)}
                    className={`p-3 flex items-start gap-3 text-xs cursor-pointer transition-colors hover:bg-[var(--bg-overlay)] ${
                      !item.readAt ? "bg-[var(--accent-soft)]/20" : ""
                    }`}
                  >
                    <div className="mt-0.5 p-1 rounded-full bg-[var(--bg-base)] border border-[var(--border)] shrink-0">
                      {getIcon(item.type)}
                    </div>

                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-[var(--text)] truncate">
                          {item.actorName}
                        </span>
                        <span className="text-[10px] text-[var(--text-subtle)] font-mono-id shrink-0">
                          {item.createdAt}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                        {item.title}
                      </p>

                      {item.issueKey && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <Badge variant="mono" size="sm">
                            {item.issueKey}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {!item.readAt && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
