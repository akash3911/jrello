import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="dot-grid flex min-h-screen flex-col items-center justify-center bg-[var(--bg-base)] p-4 select-none">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--accent)] to-[var(--palette-purple)] font-mono-id text-sm font-bold text-white">
              J
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">Jrello</span>
              <span className="font-mono-id text-[11px] text-[var(--text-subtle)]">
                welcome back
              </span>
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Home
            </Button>
          </Link>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] p-1 shadow-[var(--shadow-md)]">
          <SignIn signUpUrl="/sign-up" />
        </div>
      </div>
    </div>
  );
}
