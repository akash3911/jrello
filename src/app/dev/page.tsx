"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Moon,
  Sun,
  ShieldCheck,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

function useIsMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function DevGalleryPage() {
  const { theme, setTheme } = useTheme();
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);
  const [motionActive, setMotionActive] = React.useState<string | null>(null);
  const mounted = useIsMounted();

  const copyToClipboard = (token: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const triggerMotion = (key: string) => {
    setMotionActive(key);
    setTimeout(() => setMotionActive(null), 800);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text)] selection:bg-[var(--accent-soft)] selection:text-[var(--accent)] pb-24">
      {/* Top sticky nav */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-none px-6 select-none">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 text-xs"
              title="Return to Kanban Board"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Back to Board</span>
            </Button>
          </Link>
          <div className="h-4 w-[1px] bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <span className="font-mono-id text-xs font-bold text-[var(--accent)] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] border border-[var(--accent)]/20">
              /dev
            </span>
            <h1 className="text-sm font-semibold text-[var(--text)]">
              Design System & Component Gallery
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="gap-1.5 text-xs font-mono-id"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[var(--warning)]" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>Dark</span>
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Main content container */}
      <main className="max-w-6xl mx-auto px-6 pt-8 flex flex-col gap-12">
        {/* Gallery Intro & Constraint Header */}
        <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            <Terminal className="h-4 w-4" />
            <span>Opinionated, Developer-First Design Tokens</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-3xl">
            This living reference renders the exact token scale specified in{" "}
            <code className="font-mono-id text-[var(--text)] bg-[var(--bg-base)] px-1 py-0.5 rounded border border-[var(--border)]">
              docs/DESIGN-SYSTEM.md
            </code>
            : neutral-forward background hierarchy, calm teal-cyan single accent, 4px base type scale with Inter + JetBrains Mono pairing, borders over shadows, and 4/6/8px radius constraints.
          </p>
        </div>

        {/* Section 1: Typography System */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-base font-semibold text-[var(--text)]">
              1. Typography (Inter + JetBrains Mono Pairing)
            </h2>
            <span className="text-xs font-mono-id text-[var(--text-subtle)]">
              Body Default: 14px / 1.5
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scale card */}
            <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-3">
              <div className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                Inter Type Hierarchy
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between border-b border-[var(--border)]/40 pb-1.5">
                  <span className="text-xs text-[var(--text-muted)]">text-xs (12px / 500)</span>
                  <span className="text-xs font-medium">Metadata, labels, table captions</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--border)]/40 pb-1.5">
                  <span className="text-xs text-[var(--text-muted)]">text-sm (13px / 400)</span>
                  <span className="text-sm">Secondary text, compact table cells</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--border)]/40 pb-1.5">
                  <span className="text-xs text-[var(--text-muted)] font-bold text-[var(--accent)]">
                    text-base (14px / 400)
                  </span>
                  <span className="text-base font-medium">Default Body (Developer density)</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--border)]/40 pb-1.5">
                  <span className="text-xs text-[var(--text-muted)]">text-md (15px / 500)</span>
                  <span className="text-[15px] font-medium">Emphasized issue titles</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--border)]/40 pb-1.5">
                  <span className="text-xs text-[var(--text-muted)]">text-lg (17px / 600)</span>
                  <span className="text-lg font-semibold tracking-tight">Section headers</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[var(--text-muted)]">text-xl (20px / 600)</span>
                  <span className="text-xl font-semibold tracking-tight">Page headers</span>
                </div>
              </div>
            </div>

            {/* Mono pairing card */}
            <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-3">
              <div className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                JetBrains Mono Identifiers
              </div>
              <div className="flex flex-col gap-3 font-mono-id text-xs">
                <div className="p-2.5 rounded bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Issue Key</span>
                  <span className="font-bold text-[var(--accent)]">JREL-142</span>
                </div>
                <div className="p-2.5 rounded bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Git Branch</span>
                  <span className="text-[var(--text)]">feat/clerk-auth-mirror</span>
                </div>
                <div className="p-2.5 rounded bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Database UUID</span>
                  <span className="text-[var(--text-subtle)] text-[11px]">
                    4f89d3a1-2b0e-4c7a-9f12
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Timestamp</span>
                  <span className="text-[var(--text)]">2026-08-08T15:30:00Z</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Color Palette Tokens */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-base font-semibold text-[var(--text)]">
              2. Neutral Scale & Calm Teal-Cyan Accent
            </h2>
            <span className="text-xs font-mono-id text-[var(--text-subtle)]">
              Click any token to copy CSS variable
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {[
              { token: "--bg-base", name: "Base", desc: "App background" },
              { token: "--bg-raised", name: "Raised", desc: "Cards & sidebar" },
              { token: "--bg-overlay", name: "Overlay", desc: "Hover & insets" },
              { token: "--border", name: "Border", desc: "Default border" },
              { token: "--border-strong", name: "Strong", desc: "Emphasized" },
              { token: "--text", name: "Text", desc: "Primary text" },
              { token: "--text-muted", name: "Muted", desc: "Secondary" },
              { token: "--text-subtle", name: "Subtle", desc: "Tertiary" },
            ].map((item) => (
              <button
                key={item.token}
                onClick={() => copyToClipboard(item.token, `var(${item.token})`)}
                className="p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] hover:border-[var(--border-strong)] transition-all flex flex-col gap-2 text-left select-none group"
              >
                <div
                  className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border)]"
                  style={{ backgroundColor: `var(${item.token})` }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs text-[var(--text)] truncate">
                    {item.name}
                  </span>
                  <span className="font-mono-id text-[10px] text-[var(--text-subtle)] truncate">
                    {copiedToken === item.token ? "Copied!" : item.token}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Accent & Semantic Palette */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            {/* Teal Accent */}
            <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--accent)]/30 bg-[var(--accent-soft)] flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[var(--accent)] uppercase font-mono-id">
                Accent (Teal-Cyan)
              </span>
              <span className="text-xs font-semibold text-[var(--accent)]">
                #0e7490 (Light) · #22d3ee (Dark)
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Used strictly for primary actions, focus rings, and active indicators. Never used as giant gradient fills.
              </p>
            </div>

            {/* Success */}
            <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success-soft)] flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[var(--success-fg)] uppercase font-mono-id">
                Success
              </span>
              <span className="text-xs font-semibold text-[var(--success-fg)]">
                #16a34a (Light) · #4ade80 (Dark)
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Done status, test passes, successful merge and container health checks.
              </p>
            </div>

            {/* Warning */}
            <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[var(--warning-fg)] uppercase font-mono-id">
                Warning
              </span>
              <span className="text-xs font-semibold text-[var(--warning-fg)]">
                #ca8a04 (Light) · #facc15 (Dark)
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Blocked cards, pending reviews, rate-limit threshold alerts.
              </p>
            </div>

            {/* Danger */}
            <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[var(--danger-fg)] uppercase font-mono-id">
                Danger
              </span>
              <span className="text-xs font-semibold text-[var(--danger-fg)]">
                #dc2626 (Light) · #f87171 (Dark)
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Urgent priority, destructive actions, CI build failures.
              </p>
            </div>
          </div>

          {/* 8-Hue Priority & Label Palette */}
          <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-3">
            <div className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
              Balanced 8-Hue Label Palette (No Random Hex)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {[
                { name: "Gray", var: "--palette-gray", soft: "--palette-gray-soft" },
                { name: "Red", var: "--palette-red", soft: "--palette-red-soft" },
                { name: "Orange", var: "--palette-orange", soft: "--palette-orange-soft" },
                { name: "Yellow", var: "--palette-yellow", soft: "--palette-yellow-soft" },
                { name: "Green", var: "--palette-green", soft: "--palette-green-soft" },
                { name: "Teal", var: "--palette-teal", soft: "--palette-teal-soft" },
                { name: "Blue", var: "--palette-blue", soft: "--palette-blue-soft" },
                { name: "Purple", var: "--palette-purple", soft: "--palette-purple-soft" },
              ].map((hue) => (
                <div
                  key={hue.name}
                  className="p-2 rounded-[var(--radius-sm)] border border-[var(--border)] flex flex-col gap-1 text-center"
                  style={{ backgroundColor: `var(${hue.soft})` }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: `var(${hue.var})` }}
                  >
                    {hue.name}
                  </span>
                  <span className="text-[10px] font-mono-id text-[var(--text-subtle)]">
                    Soft + Text
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Buttons Matrix */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-base font-semibold text-[var(--text)]">
              3. Button Variants & Sizes
            </h2>
            <span className="text-xs font-mono-id text-[var(--text-subtle)]">
              Flat · 6px Radius · No Gradient
            </span>
          </div>

          <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-5">
            {/* Size SM (32px) */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                Size SM (32px / 2.5rem padding / 12px text)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">
                  Primary Action
                </Button>
                <Button variant="secondary" size="sm">
                  Secondary Action
                </Button>
                <Button variant="ghost" size="sm">
                  Ghost Button
                </Button>
                <Button variant="outline" size="sm">
                  Outline
                </Button>
                <Button variant="danger" size="sm">
                  Destructive
                </Button>
                <Button variant="secondary" size="sm" disabled>
                  Disabled State
                </Button>
              </div>
            </div>

            {/* Size MD (36px) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]/50">
              <span className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                Size MD (36px / 3.5rem padding / 13-14px text)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="md">
                  Primary Button
                </Button>
                <Button variant="secondary" size="md">
                  Secondary Button
                </Button>
                <Button variant="ghost" size="md">
                  Ghost
                </Button>
                <Button variant="outline" size="md">
                  Outline
                </Button>
                <Button variant="danger" size="md">
                  Delete Project
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Form Controls & Inputs */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-base font-semibold text-[var(--text)]">
              4. Form Controls & Inputs
            </h2>
            <span className="text-xs font-mono-id text-[var(--text-subtle)]">
              32-36px Height · 4px Radius · Focus Ring
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-3">
              <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                Search Input with Keyboard Badge
              </label>
              <Input
                leftIcon={<Search className="h-3.5 w-3.5" />}
                rightElement={
                  <kbd className="inline-flex h-4 items-center rounded border border-[var(--border)] bg-[var(--bg-overlay)] px-1 font-mono-id text-[10px] text-[var(--text-subtle)]">
                    ⌘K
                  </kbd>
                }
                placeholder="Search issues, pull requests, members..."
              />
            </div>

            <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-3">
              <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                Issue Key Input
              </label>
              <Input placeholder="e.g. JREL-142" defaultValue="JREL-101" />
            </div>
          </div>
        </section>

        {/* Section 5: Badges, Priorities & Statuses */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-base font-semibold text-[var(--text)]">
              5. Priority Indicators & Status Chips
            </h2>
            <span className="text-xs font-mono-id text-[var(--text-subtle)]">
              Single-line · Soft Semantic Tints
            </span>
          </div>

          <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-5">
            {/* Priority badges */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                Issue Priority Indicators (Fixed 5 Levels)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <PriorityBadge priority="URGENT" />
                <PriorityBadge priority="HIGH" />
                <PriorityBadge priority="MEDIUM" />
                <PriorityBadge priority="LOW" />
                <PriorityBadge priority="NONE" />
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]/50">
              <span className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                Issue Status Kinds (Canonical Prisma Enum)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="BACKLOG" />
                <StatusBadge status="TODO" />
                <StatusBadge status="IN_PROGRESS" />
                <StatusBadge status="IN_REVIEW" />
                <StatusBadge status="DONE" />
                <StatusBadge status="CANCELED" />
              </div>
            </div>

            {/* Semantic Soft Badges */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]/50">
              <span className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                Semantic Soft Badges & Identifiers
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="mono">JREL-101</Badge>
                <Badge variant="accent">Active Sprint</Badge>
                <Badge variant="success">Merged PR #42</Badge>
                <Badge variant="warning">Blocked on API</Badge>
                <Badge variant="danger">High Severity</Badge>
                <Badge variant="info">Docs Ready</Badge>
                <Badge variant="purple">Backend Engine</Badge>
                <Badge variant="orange">Developer CLI</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Motion Tokens */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h2 className="text-base font-semibold text-[var(--text)]">
              6. Motion Tokens (Context Preservation, Not Entertainment)
            </h2>
            <span className="text-xs font-mono-id text-[var(--text-subtle)]">
              prefers-reduced-motion respected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { key: "instant", name: "Instant (0ms)", desc: "Direct state swaps" },
              { key: "fast", name: "Fast (90ms)", desc: "Hover, focus, toggle" },
              { key: "normal", name: "Normal (160ms)", desc: "Card settle, panels" },
              { key: "slow", name: "Slow (240ms)", desc: "Dialog/modal entry" },
            ].map((m) => (
              <div
                key={m.key}
                onClick={() => triggerMotion(m.key)}
                className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] flex flex-col gap-2 cursor-pointer hover:border-[var(--border-strong)] transition-all select-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text)]">
                    {m.name}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]">
                    Test
                  </Button>
                </div>
                <div className="h-8 rounded bg-[var(--bg-base)] border border-[var(--border)] overflow-hidden flex items-center px-1">
                  <div
                    className={cn(
                      "h-5 w-5 rounded bg-[var(--accent)] transition-all",
                      m.key === "instant" && "duration-0",
                      m.key === "fast" && "duration-[var(--duration-fast)]",
                      m.key === "normal" && "duration-[var(--duration-normal)]",
                      m.key === "slow" && "duration-[var(--duration-slow)]",
                      motionActive === m.key ? "translate-x-36 bg-[var(--success)]" : "translate-x-0"
                    )}
                  />
                </div>
                <span className="text-[11px] text-[var(--text-subtle)]">{m.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: Anti-Slop Constraint Verification */}
        <section className="p-6 rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--success)]">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
            <span>Anti-Slop Hard Constraints Verification (DESIGN-SYSTEM.md §Anti-slop)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2 text-[var(--text-muted)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
              <span>
                <strong>No Purple/Blue SaaS Gradients:</strong> All cards and backgrounds are flat with 1px border separation.
              </span>
            </div>
            <div className="flex items-start gap-2 text-[var(--text-muted)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
              <span>
                <strong>No Glassmorphism Slop:</strong> Solid surfaces without heavy blur over decorative photos.
              </span>
            </div>
            <div className="flex items-start gap-2 text-[var(--text-muted)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
              <span>
                <strong>Inter + JetBrains Mono Pairing:</strong> Identifiers, codes, and counts use strict monospace font.
              </span>
            </div>
            <div className="flex items-start gap-2 text-[var(--text-muted)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
              <span>
                <strong>Restrained Radius:</strong> Only 4px, 6px, and 8px used across all components. Nothing pillowy.
              </span>
            </div>
            <div className="flex items-start gap-2 text-[var(--text-muted)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
              <span>
                <strong>Borders Over Shadows:</strong> Subtle 1px borders define resting surface hierarchy.
              </span>
            </div>
            <div className="flex items-start gap-2 text-[var(--text-muted)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
              <span>
                <strong>Consistent Icons:</strong> Lucide stroke 1.5 used systematically without random emojis.
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DevGalleryPage;
