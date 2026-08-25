"use client";

import * as React from "react";
import { ClerkProvider } from "@clerk/nextjs";

/**
 * Renders Clerk's provider only when keys are configured.
 * The publishable key is inlined at build time, so this branch is stable.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkEnabled) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}
