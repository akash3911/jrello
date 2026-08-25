"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import type { PresenceViewer } from "@/lib/realtime/events";

export function PresenceAvatars({
  viewers,
  liveAnnouncement,
}: {
  viewers: PresenceViewer[];
  liveAnnouncement?: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {viewers.length > 0 && (
        <>
          <span
            title={`${viewers.length} viewing this board`}
            className="flex select-none items-center gap-1.5 rounded-full border border-[var(--success)]/30 bg-[var(--success-soft)] px-2 py-0.5 font-mono-id text-[10px] font-semibold text-[var(--success-fg)]"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--success)]" />
            {viewers.length} live
          </span>
          <div className="flex -space-x-1.5">
            {viewers.slice(0, 5).map((v) => (
              <span
                key={v.id}
                title={`${v.name} is here`}
                className="rounded-full ring-2 ring-[var(--bg-base)] transition-transform hover:z-10 hover:scale-110"
              >
                <Avatar
                  src={v.avatarUrl}
                  fallback={v.initials || v.name.slice(0, 2).toUpperCase()}
                  size="xs"
                  className="text-[9px] font-bold"
                />
              </span>
            ))}
            {viewers.length > 5 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-inset)] text-[9px] font-bold text-[var(--text-muted)] ring-2 ring-[var(--bg-base)]">
                +{viewers.length - 5}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
