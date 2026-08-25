"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Building2, Layers, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [workspaceName, setWorkspaceName] = React.useState("Acme Software");
  const [workspaceSlug, setWorkspaceSlug] = React.useState("acme-software");
  const [projectName, setProjectName] = React.useState("Core Platform");
  const [projectKey, setProjectKey] = React.useState("CORE");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleWorkspaceName = (val: string) => {
    setWorkspaceName(val);
    setWorkspaceSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const handleProjectName = (val: string) => {
    setProjectName(val);
    const words = val.trim().split(/\s+/).filter(Boolean);
    if (!words[0]) {
      setProjectKey("");
      return;
    }
    if (words.length >= 2) {
      setProjectKey(
        (words[0][0] + words[1][0] + (words[2]?.[0] ?? "")).toUpperCase()
      );
    } else {
      setProjectKey(words[0].slice(0, 4).toUpperCase());
    }
  };

  const finish = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName.trim(),
          slug: workspaceSlug.trim(),
          initialProject: {
            name: projectName.trim(),
            slug: projectName
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, ""),
            key: projectKey.trim().toUpperCase(),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create workspace");
      }

      router.push(`/${workspaceSlug.trim()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="dot-grid flex min-h-screen select-none flex-col items-center justify-center bg-[var(--bg-base)] p-4">
      <div className="flex w-full max-w-lg flex-col gap-6">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--accent)] to-[var(--palette-purple)] font-mono-id text-sm font-bold text-white">
              J
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">Jrello</span>
              <span className="font-mono-id text-[11px] text-[var(--text-subtle)]">
                Step {step} of 2
              </span>
            </span>
          </Link>
          <Badge variant="accent" size="sm">
            setup
          </Badge>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          <span className={cn("h-1 flex-1 rounded-full transition-colors", step >= 1 ? "bg-[var(--accent)]" : "bg-[var(--bg-inset)]")} />
          <span className={cn("h-1 flex-1 rounded-full transition-colors", step >= 2 ? "bg-[var(--accent)]" : "bg-[var(--bg-inset)]")} />
        </div>

        <div className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] p-6 shadow-[var(--shadow-md)] animate-modal-in">
          {error && (
            <p className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger-fg)]">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          {step === 1 ? (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Building2 className="h-4 w-4 text-[var(--accent)]" />
                  Create your workspace
                </h2>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  A workspace is your team&apos;s home — projects, members and settings
                  live here.
                </p>
              </div>

              <div className="flex flex-col gap-3.5 pt-1">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                    Workspace name
                  </span>
                  <Input
                    value={workspaceName}
                    onChange={(e) => handleWorkspaceName(e.target.value)}
                    placeholder="Acme Software"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                    URL slug
                  </span>
                  <div className="flex items-stretch">
                    <span className="flex h-8 items-center rounded-l-[var(--radius-sm)] border border-r-0 border-[var(--border)] bg-[var(--bg-overlay)] px-2.5 font-mono-id text-xs text-[var(--text-subtle)]">
                      /
                    </span>
                    <input
                      type="text"
                      value={workspaceSlug}
                      onChange={(e) =>
                        setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      }
                      placeholder="acme-software"
                      className="flex h-8 w-full rounded-r-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-3 font-mono-id text-xs outline-none focus-ring"
                    />
                  </div>
                </label>
              </div>

              <div className="flex justify-end border-t border-[var(--border)] pt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (workspaceName.trim() && workspaceSlug.trim()) setStep(2);
                  }}
                  disabled={!workspaceName.trim() || !workspaceSlug.trim()}
                  className="gap-2"
                >
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Layers className="h-4 w-4 text-[var(--accent)]" />
                  Create your first project
                </h2>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  Projects map to a codebase or product. Each gets a key used for issue
                  references like{" "}
                  <code className="rounded bg-[var(--bg-inset)] px-1 font-mono-id font-bold text-[var(--accent)]">
                    {projectKey || "PROJ"}-101
                  </code>
                  .
                </p>
              </div>

              <div className="flex flex-col gap-3.5 pt-1">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                    Project name
                  </span>
                  <Input
                    value={projectName}
                    onChange={(e) => handleProjectName(e.target.value)}
                    placeholder="Core Platform"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                    Issue key (2–6 letters)
                  </span>
                  <Input
                    value={projectKey}
                    onChange={(e) =>
                      setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
                    }
                    placeholder="CORE"
                    maxLength={6}
                    className="font-mono-id font-bold uppercase text-[var(--accent)]"
                    required
                  />
                  <span className="font-mono-id text-[10px] text-[var(--text-subtle)]">
                    issues will look like {projectKey || "PROJ"}-101, {projectKey || "PROJ"}-102…
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} disabled={loading}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void finish()}
                  disabled={
                    loading || !projectName.trim() || projectKey.trim().length < 2
                  }
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Provisioning…
                    </>
                  ) : (
                    <>
                      Finish & launch board <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
