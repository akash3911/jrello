/**
 * Auth mode resolution.
 *
 * - "clerk": full Clerk authentication (publishable + secret keys present)
 * - "local": zero-config development mode. Requests are auto-authenticated
 *   as a single local developer user so the entire product is usable
 *   without external services.
 */

export type AuthMode = "clerk" | "local";

export function getAuthMode(): AuthMode {
  const hasClerkKeys =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !!process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

  return hasClerkKeys ? "clerk" : "local";
}

export function isClerkEnabled(): boolean {
  return getAuthMode() === "clerk";
}

/** Identity of the auto-provisioned local developer user. */
export const LOCAL_DEV_USER = {
  clerkId: "local_dev_user",
  email: "dev@jrello.local",
  name: "Local Developer",
};
