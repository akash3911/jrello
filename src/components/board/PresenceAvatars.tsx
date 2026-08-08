"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { type PresenceViewer } from "@/lib/realtime/events";

interface PresenceAvatarsProps {
  viewers: PresenceViewer[];
  liveAnnouncement?: string | null;
}

export function PresenceAvatars({ viewers, liveAnnouncement }: PresenceAvatarsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Screen-reader announcement of live changes */}
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Live Badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[var(--success)]/30 bg-[var(--success-soft)] text-[10px] font-mono-id text-[var(--success-fg)] font-semibold select-none">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
        <span>LIVE ({viewers.length})</span>
      </div>

      {/* Viewer Avatars Stack */}
      <div className="flex items-center -space-x-1.5 overflow-hidden">
        {viewers.map((viewer) => (
          <div
            key={viewer.id}
            title={`${viewer.name} is viewing this board`}
            className="relative rounded-full ring-2 ring-[var(--bg-base)] transition-transform hover:scale-110 hover:z-10"
          >
            <Avatar
              fallback={viewer.initials}
              size="xs"
              className="text-[10px] font-bold"
              style={{
                backgroundColor: viewer.color ? `${viewer.color}25` : "var(--accent-soft)",
                color: viewer.color || "var(--accent)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
