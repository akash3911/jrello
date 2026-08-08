"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Building2, Layers, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);

  // Workspace Form State
  const [workspaceName, setWorkspaceName] = React.useState("Acme Software");
  const [workspaceSlug, setWorkspaceSlug] = React.useState("acme-eng");

  // Project Form State
  const [projectName, setProjectName] = React.useState("Core Platform");
  const [projectKey, setProjectKey] = React.useState("CORE");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setWorkspaceName(val);
    setWorkspaceSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const handleProjectNameChange = (val: string) => {
    setProjectName(val);
    const words = val.trim().split(/\s+/);
    if (words.length >= 2) {
      setProjectKey((words[0][0] + words[1][0] + (words[2] ? words[2][0] : "")).toUpperCase());
    } else if (words[0]) {
      setProjectKey(words[0].slice(0, 4).toUpperCase());
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName,
          slug: workspaceSlug,
          initialProject: {
            name: projectName,
            slug: projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            key: projectKey,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create workspace");
      }

      router.push(`/${workspaceSlug}`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Something went wrong. Please check your inputs.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-base)] text-[var(--text)] p-4 select-none">
      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-fg)] font-mono-id font-bold text-sm">
              JR
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[var(--text)] tracking-tight">
                Jrello Onboarding
              </span>
              <span className="text-[11px] text-[var(--text-subtle)] font-mono-id">
                Step {step} of 2
              </span>
            </div>
          </div>

          <Badge variant="accent" size="sm">
            Phase 2
          </Badge>
        </div>

        {/* Wizard Card */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] p-6 shadow-[var(--shadow-sm)] flex flex-col gap-6">
          {error && (
            <div className="p-3 rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger-fg)] text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Workspace Creation */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[var(--accent)]" />
                  <h2 className="text-base font-semibold text-[var(--text)]">
                    Create Your Engineering Workspace
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  The workspace is your organization&apos;s tenancy boundary where projects, billing, and teams live.
                </p>
              </div>

              <div className="flex flex-col gap-3.5 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                    Workspace Name
                  </label>
                  <Input
                    value={workspaceName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Acme Software"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                    Workspace URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="h-8 px-2.5 flex items-center rounded-l-[var(--radius-sm)] border border-r-0 border-[var(--border)] bg-[var(--bg-overlay)] text-xs text-[var(--text-subtle)] font-mono-id">
                      jrello.com/
                    </span>
                    <input
                      type="text"
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase())}
                      placeholder="acme-eng"
                      className="flex h-8 w-full rounded-r-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-base)] px-3 text-xs text-[var(--text)] font-mono-id focus-ring outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-[var(--border)]">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (workspaceName.trim() && workspaceSlug.trim()) {
                      setStep(2);
                    }
                  }}
                  disabled={!workspaceName.trim() || !workspaceSlug.trim()}
                  className="gap-2 text-xs"
                >
                  <span>Continue to Project</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            /* Step 2: First Project Creation */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[var(--accent)]" />
                  <h2 className="text-base font-semibold text-[var(--text)]">
                    Create Your First Project
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Projects represent distinct codebases or products. Each has a short identifier prefix for issue keys (e.g. CORE-101).
                </p>
              </div>

              <div className="flex flex-col gap-3.5 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                    Project Name
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => handleProjectNameChange(e.target.value)}
                    placeholder="e.g. Core Platform"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-subtle)] uppercase">
                    Issue Key Prefix (2–6 uppercase chars)
                  </label>
                  <Input
                    value={projectKey}
                    onChange={(e) => setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                    placeholder="CORE"
                    className="font-mono-id text-xs font-bold text-[var(--accent)] uppercase"
                    maxLength={6}
                    required
                  />
                  <span className="text-[11px] text-[var(--text-subtle)] font-mono-id">
                    Issues will look like: {projectKey || "PROJ"}-101, {projectKey || "PROJ"}-102
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="text-xs"
                >
                  Back
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCompleteOnboarding}
                  disabled={loading || !projectName.trim() || !projectKey.trim()}
                  className="gap-2 text-xs"
                >
                  {loading ? (
                    <span>Provisioning Workspace...</span>
                  ) : (
                    <>
                      <span>Finish & Launch Board</span>
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
