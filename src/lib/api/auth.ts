import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export interface CurrentActor {
  user: User;
  clerkUserId: string;
}

export async function getCurrentUser(): Promise<CurrentActor | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // 1. Try to find the local mirror row
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // 2. If not found yet (e.g. before webhook arrival), auto-provision from Clerk metadata
  if (!user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const primaryEmail =
        clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
          ?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        `${clerkUser.id}@user.clerk`;

      user = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {
          email: primaryEmail,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || null,
          avatarUrl: clerkUser.imageUrl || null,
        },
        create: {
          clerkId: userId,
          email: primaryEmail,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || null,
          avatarUrl: clerkUser.imageUrl || null,
        },
      });
    }
  }

  if (!user || user.deletedAt) {
    return null;
  }

  return {
    user,
    clerkUserId: userId,
  };
}

export async function requireAuth(): Promise<CurrentActor> {
  const actor = await getCurrentUser();
  if (!actor) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return actor;
}
