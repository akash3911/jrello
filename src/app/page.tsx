import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Keyboard,
  KanbanSquare,
  Zap,
  GitBranch,
} from "lucide-react";
import { getCurrentUser } from "@/lib/api/auth";
import { getUserWorkspaces } from "@/lib/api/workspaces";
import { isClerkEnabled } from "@/lib/auth-mode";

// Auth + workspace lookup must run per-request
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const actor = await getCurrentUser();

  if (actor) {
    const workspaces = await getUserWorkspaces(actor.user.id);
    if (workspaces.length > 0) {
      redirect(`/${workspaces[0].slug}`);
    }
    // Authenticated but no workspace yet → straight into onboarding
    if (!isClerkEnabled()) {
      redirect("/onboarding");
    }
  }

  const signedIn = !!actor;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text)]">
      {/* Nav */}
      <header className="flex h-14 items-center justify-between px-6">
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--accent)] to-[var(--palette-purple)] font-mono-id text-xs font-bold text-white">
            J
          </span>
          <span className="font-semibold tracking-tight">Jrello</span>
        </span>
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <Link
              href="/onboarding"
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              Create workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex h-8 items-center rounded-[var(--radius-md)] px-3.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text)]"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-8 items-center rounded-[var(--radius-md)] bg-[var(--accent)] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="dot-grid flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <p className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1 font-mono-id text-[11px] text-[var(--text-muted)] shadow-[var(--shadow-xs)]">
            keyboard-first issue tracking
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Ship faster with a tracker that keeps up with{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--palette-purple)] bg-clip-text text-transparent">
              your keyboard
            </span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            Dense kanban boards, sprint planning, realtime presence, and GitHub-aware
            issue keys — purpose-built for high-velocity engineering teams that live in
            their terminal and their browser.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={signedIn ? "/onboarding" : "/sign-up"}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[0_4px_16px_var(--accent-glow)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[0_6px_24px_var(--accent-glow)]"
            >
              {signedIn ? "Create a workspace" : "Start tracking free"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {!signedIn && (
              <Link
                href="/sign-in"
                className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-raised)] px-5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--text-subtle)]"
              >
                I already have an account
              </Link>
            )}
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <FeatureCard
            icon={KanbanSquare}
            title="Kanban that flows"
            body="Drag-and-drop with optimistic updates and fractional sort orders that never fight you."
          />
          <FeatureCard
            icon={Keyboard}
            title="Keyboard-first"
            body="J/K/L/H navigation, ⌘K command palette, one-key create. Your hands never leave home row."
          />
          <FeatureCard
            icon={Zap}
            title="Realtime presence"
            body="See teammates on the board as you plan. Moves broadcast instantly across the team."
          />
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center font-mono-id text-[11px] text-[var(--text-subtle)]">
        Jrello · built for engineers who move fast
        <span className="mx-2 inline-flex translate-y-px items-center gap-1">
          <GitBranch className="h-3 w-3" /> main
        </span>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] p-5 text-left shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]">
      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-soft)] text-[var(--accent)]">
        <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{body}</p>
    </div>
  );
}
