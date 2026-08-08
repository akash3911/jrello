import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-base)] text-[var(--text)] p-4 select-none">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-fg)] font-mono-id font-bold text-sm">
              JR
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[var(--text)] tracking-tight">
                Jrello
              </span>
              <span className="text-[11px] text-[var(--text-subtle)] font-mono-id">
                Developer Issue Tracker
              </span>
            </div>
          </div>

          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-[var(--text-subtle)]">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>
          </Link>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] p-1 shadow-[var(--shadow-sm)]">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-none p-6",
                headerTitle: "text-[var(--text)] text-base font-semibold",
                headerSubtitle: "text-[var(--text-muted)] text-xs",
                formButtonPrimary:
                  "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-semibold rounded-[var(--radius-md)] h-9 shadow-none",
                formFieldInput:
                  "bg-[var(--bg-base)] border-[var(--border)] text-[var(--text)] rounded-[var(--radius-sm)] text-xs h-9 focus:ring-2 focus:ring-[var(--accent)]",
                formFieldLabel: "text-[var(--text-subtle)] text-xs uppercase font-medium",
                footerActionLink: "text-[var(--accent)] hover:underline text-xs",
                identityPreviewText: "text-[var(--text)] text-xs",
                socialButtonsBlockButton:
                  "bg-[var(--bg-base)] border-[var(--border)] text-[var(--text)] rounded-[var(--radius-md)] text-xs h-9 hover:bg-[var(--bg-overlay)]",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
