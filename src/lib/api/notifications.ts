import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

export interface CreateNotificationParams {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  issueId?: string;
  actorId?: string;
}

export async function createNotification({
  userId,
  workspaceId,
  type,
  issueId,
  actorId,
}: CreateNotificationParams) {
  // Avoid self-notification
  if (actorId && actorId === userId) {
    return null;
  }

  return await prisma.notification.create({
    data: {
      userId,
      workspaceId,
      type,
      issueId,
      actorId,
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function listUserNotifications(userId: string, workspaceId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
      workspaceId,
    },
    include: {
      actor: {
        select: { id: true, name: true, avatarUrl: true },
      },
      issue: {
        select: {
          id: true,
          number: true,
          title: true,
          project: { select: { key: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function getUnreadNotificationCount(userId: string, workspaceId: string) {
  return await prisma.notification.count({
    where: {
      userId,
      workspaceId,
      readAt: null,
    },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsRead(userId: string, workspaceId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      workspaceId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}
