import "server-only";
import { prisma } from "@/lib/db";
import { isClerkEnabled, LOCAL_DEV_USER } from "@/lib/auth-mode";
import type { User, WorkspaceRole, ProjectRole } from "@prisma/client";

export interface CurrentActor {
  user: User;
  clerkUserId: string;
  workspaceRole?: WorkspaceRole;
  projectRole?: ProjectRole;
}

async function upsertLocalDevUser(): Promise<User> {
  return prisma.user.upsert({
    where: { clerkId: LOCAL_DEV_USER.clerkId },
    update: {},
    create: {
      clerkId: LOCAL_DEV_USER.clerkId,
      email: LOCAL_DEV_USER.email,
      name: LOCAL_DEV_USER.name,
      avatarUrl: null,
    },
  });
}

async function getClerkUser(): Promise<User | null> {
  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) return null;

  // 1. Try the local mirror row first
  let user = await prisma.user.findUnique({ where: { clerkId: userId } });

  // 2. Auto-provision from Clerk metadata (e.g. before webhook arrival)
  if (!user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const primaryEmail =
        clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
          ?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        `${clerkUser.id}@user.clerk`;

      const name =
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        clerkUser.username ||
        null;

      user = await prisma.user.upsert({
        where: { clerkId: userId },
        update: { email: primaryEmail, name, avatarUrl: clerkUser.imageUrl || null },
        create: {
          clerkId: userId,
          email: primaryEmail,
          name,
          avatarUrl: clerkUser.imageUrl || null,
        },
      });
    }
  }

  return user;
}

/**
 * Resolve the acting user for the current request.
 * Returns null only when Clerk mode is active and the visitor is signed out.
 */
export async function getCurrentUser(): Promise<CurrentActor | null> {
  if (!isClerkEnabled()) {
    const user = await upsertLocalDevUser();
    return { user, clerkUserId: user.clerkId };
  }

  const user = await getClerkUser();
  if (!user) return null;

  return { user, clerkUserId: user.clerkId };
}

export async function requireAuth(): Promise<CurrentActor> {
  const actor = await getCurrentUser();
  if (!actor) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return actor;
}
