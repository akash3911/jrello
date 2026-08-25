"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, UserPlus, MessageSquare, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/format";

type NotificationType = "ASSIGNED" | "MENTIONED" | "COMMENTED" | "STATUS_CHANGED";

interface NotificationItem {
  id: string;
  type: NotificationType;
  readAt: string | null;
  createdAt: string;
  actorName?: string | null;
  issueKey?: string | null;
  issueTitle?: string | null;
  issueHref?: string | null;
}

const typeIcon: Record<NotificationType, React.ReactNode> = {
  ASSIGNED: <UserPlus className="h-3.5 w-3.5 text-[var(--success)]" />,
  MENTIONED: <MessageSquare className="h-3.5 w-3.5 text-[var(--palette-purple)]" />,
  COMMENTED: <MessageSquare className="h-3.5 w-3.5 text-[var(--info)]" />,
  STATUS_CHANGED: <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />,
};

const typeText: Record<NotificationType, string> = {
  ASSIGNED: "assigned you",
  MENTIONED: "mentioned you",
  COMMENTED: "commented",
  STATUS_CHANGED: "updated status on",
};

export function NotificationInbox({ workspaceSlug }: { workspaceSlug: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!isOpen || loaded) return;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/v1/workspaces/${workspaceSlug}/notifications`);
        if (cancelled || !res.ok) return;
        const data = await res.json();

        setUnread(data.unreadCount ?? 0);
        setItems(
          ((data.notifications ?? []) as Record<string, unknown>[]).map((n) => {
            const actor = n.actor as { name?: string | null } | null;
            const issue = n.issue as
              | { number: number; title: string; project: { key: string } }
              | null;
            return {
              id: n.id as string,
              type: n.type as NotificationType,
              readAt: (n.readAt as string) ?? null,
              createdAt: n.createdAt as string,
              actorName: actor?.name ?? "Someone",
              issueKey: issue ? `${issue.project.key}-${issue.number}` : null,
              issueTitle: issue?.title ?? null,
              issueHref:
                n.issueId && issue
                  ? `/${workspaceSlug}/issue/${issue.project.key}-${issue.number}`
                  : null,
            };
          })
        );
        setLoaded(true);
      } catch {
        // Inbox is non-critical; fail silently.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, loaded, workspaceSlug]);

  const markRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n
      )
    );
    setUnread((u) => Math.max(0, u - 1));
    await fetch(`/api/v1/workspaces/${workspaceSlug}/notifications/${id}/read`, {
      method: "PATCH",
    }).catch(() => {});
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnread(0);
    await fetch(`/api/v1/workspaces/${workspaceSlug}/notifications`, {
      method: "PATCH",
    }).catch(() => {});
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative rounded-[var(--radius-md)] p-2 text-[var(--text-subtle)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text)] focus-ring"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 font-mono-id text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 flex w-96 flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] shadow-[var(--shadow-lg)] animate-modal-in">
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)] px-4 py-2.5">
              <span className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                Notifications
                {unread > 0 && (
                  <Badge variant="accent" size="xs">
                    {unread} new
                  </Badge>
                )}
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-[var(--accent)] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 divide-y divide-[var(--border)]/60 overflow-y-auto">
              {!loaded ? (
                <div className="p-6 text-center text-xs text-[var(--text-subtle)]">
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto h-5 w-5 text-[var(--text-subtle)] opacity-50" />
                  <p className="mt-2 text-xs text-[var(--text-muted)]">You&apos;re all caught up.</p>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      void markRead(item.id);
                      if (item.issueHref) {
                        setIsOpen(false);
                        router.push(item.issueHref);
                      }
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-[var(--bg-overlay)]",
                      !item.readAt && "bg-[var(--accent-soft)]/30"
                    )}
                  >
                    <span className="mt-0.5 shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-base)] p-1">
                      {typeIcon[item.type]}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-xs text-[var(--text)]">
                        <b className="font-semibold">{item.actorName}</b>{" "}
                        {typeText[item.type]}
                        {item.issueTitle ? ` “${item.issueTitle}”` : ""}
                      </span>
                      {item.issueKey && (
                        <Badge variant="mono" size="xs" className="w-fit">
                          {item.issueKey}
                        </Badge>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
                        {relativeTime(item.createdAt)}
                      </span>
                      {!item.readAt && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
