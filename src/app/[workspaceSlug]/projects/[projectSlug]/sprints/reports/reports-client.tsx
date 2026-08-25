"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

interface VelocityItem {
  sprintId: string;
  name: string;
  committedPoints: number;
  completedPoints: number;
  carryOverPoints: number;
  completionRate: number;
  startDate: string;
  endDate: string;
  totalIssues: number;
}

export default function SprintReportClient({
  projectName,
  projectSlug,
  workspaceSlug,
  velocity,
  averageVelocity,
  reliability,
  activeSprint,
}: {
  projectName: string;
  projectSlug: string;
  workspaceSlug: string;
  velocity: VelocityItem[];
  averageVelocity: number;
  reliability: number;
  activeSprint: {
    id: string;
    name: string;
    totalIssues: number;
    totalPoints: number;
    donePoints: number;
    endDate: string;
  } | null;
}) {
  const hasData = velocity.length > 0;
  const maxCommitted = Math.max(1, ...velocity.map((v) => v.committedPoints));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/${workspaceSlug}/projects/${projectSlug}/sprints`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Planning
            </Button>
          </Link>
          <span className="text-[var(--text-subtle)]">·</span>
          <h1 className="text-base font-semibold tracking-tight">
            {projectName} Velocity
          </h1>
        </div>
        <Badge variant="accent">derived from real sprints</Badge>
      </div>

      {!hasData ? (
        /* Honest empty state */
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-raised)]/50 py-16 text-center">
          <TrendingUp className="h-6 w-6 text-[var(--text-subtle)] opacity-50" />
          <div>
            <h2 className="text-sm font-semibold">No completed sprints yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">
              Velocity and reliability metrics appear here once you complete your first
              sprint. Complete an active sprint from the planning page to see data.
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/projects/${projectSlug}/sprints`}
            className="mt-1 inline-flex h-8 items-center rounded-[var(--radius-md)] bg-[var(--accent)] px-3.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Go to sprint planning
          </Link>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="flex flex-col gap-2 p-4">
              <span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Average Velocity
                <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
              </span>
              <span className="font-mono-id text-2xl font-bold">{averageVelocity}</span>
              <span className="text-[11px] text-[var(--text-muted)]">
                story points delivered per sprint
              </span>
            </Card>

            <Card className="flex flex-col gap-2 p-4">
              <span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Commitment Reliability
                <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
              </span>
              <span className="font-mono-id text-2xl font-bold">{reliability}%</span>
              <span className="text-[11px] text-[var(--text-muted)]">
                of committed points delivered on average
              </span>
            </Card>

            <Card className="flex flex-col gap-2 p-4">
              <span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Active Sprint
                <Zap className="h-4 w-4 text-[var(--warning)]" />
              </span>
              {activeSprint ? (
                <>
                  <span className="truncate text-lg font-bold">{activeSprint.name}</span>
                  <span className="font-mono-id text-[11px] text-[var(--text-muted)]">
                    {activeSprint.donePoints}/{activeSprint.totalPoints} pts done ·{" "}
                    {activeSprint.totalIssues} issues · ends{" "}
                    {formatDate(activeSprint.endDate)}
                  </span>
                  {/* Progress bar */}
                  <span className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bg-inset)]">
                    <span
                      className="block h-full rounded-full bg-[var(--success)] transition-all"
                      style={{
                        width: `${
                          activeSprint.totalPoints > 0
                            ? Math.round(
                                (activeSprint.donePoints / activeSprint.totalPoints) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold text-[var(--text-subtle)]">—</span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    no sprint is currently running
                  </span>
                </>
              )}
            </Card>
          </div>

          {/* Chart */}
          <Card className="flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Velocity per sprint</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Committed vs delivered points, oldest to newest.
                </p>
              </div>
              <div className="flex items-center gap-4 font-mono-id text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-[var(--border-strong)]" />
                  Committed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-[var(--accent)]" />
                  Delivered
                </span>
              </div>
            </div>

            <div className="flex h-48 items-end gap-6 border-b border-[var(--border)] px-4 pt-4">
              {velocity.map((sp) => {
                const committedH = Math.round((sp.committedPoints / maxCommitted) * 150);
                const doneH = Math.round((sp.completedPoints / maxCommitted) * 150);
                return (
                  <div key={sp.sprintId} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div className="flex h-full items-end gap-1.5">
                      <div
                        style={{ height: `${Math.max(committedH, 4)}px` }}
                        title={`Committed ${sp.committedPoints} pts`}
                        className="w-7 rounded-t-[4px] bg-[var(--border-strong)] transition-opacity hover:opacity-80"
                      />
                      <div
                        style={{ height: `${Math.max(doneH, 4)}px` }}
                        title={`Delivered ${sp.completedPoints} pts`}
                        className="w-7 rounded-t-[4px] bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"
                      />
                    </div>
                    <span className="max-w-24 truncate font-mono-id text-[10px] text-[var(--text-muted)]">
                      {sp.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="grid grid-cols-12 gap-3 border-b border-[var(--border)] bg-[var(--bg-base)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
              <span className="col-span-4">Sprint</span>
              <span className="col-span-2 text-right">Committed</span>
              <span className="col-span-2 text-right">Delivered</span>
              <span className="col-span-2 text-right">Carried over</span>
              <span className="col-span-2 text-right">Reliability</span>
            </div>
            <div className="divide-y divide-[var(--border)]/60 text-xs">
              {[...velocity].reverse().map((sp) => (
                <div key={sp.sprintId} className="grid grid-cols-12 gap-3 px-4 py-3">
                  <span className="col-span-4 truncate font-medium">{sp.name}</span>
                  <span className="col-span-2 text-right font-mono-id text-[var(--text-muted)]">
                    {sp.committedPoints} pts
                  </span>
                  <span className="col-span-2 text-right font-mono-id font-bold text-[var(--accent)]">
                    {sp.completedPoints} pts
                  </span>
                  <span className="col-span-2 text-right font-mono-id text-[var(--warning-fg)]">
                    {sp.carryOverPoints} pts
                  </span>
                  <span
                    className={`col-span-2 text-right font-mono-id font-semibold ${
                      sp.completionRate >= 80 ? "text-[var(--success)]" : "text-[var(--warning-fg)]"
                    }`}
                  >
                    {sp.completionRate}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
