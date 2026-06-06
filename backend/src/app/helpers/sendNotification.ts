import { StatusCodes } from "http-status-codes";
import AppError from "../errors/AppError";
import prisma from "../lib/prisma";
import { NotificationType } from "../../generated/prisma/enums";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type NotificationPayload = {
  type: NotificationType;
  message: string;
  userId: string;
  projectId?: string;
  taskId?: string;
};

// ─────────────────────────────────────────────
// CREATE & STORE IN-APP NOTIFICATION
// ─────────────────────────────────────────────

export const sendNotification = async (payload: NotificationPayload): Promise<void> => {
  try {
    // Use fully scalar (unchecked) style — mixing `user: { connect }` with
    // optional scalar FKs like `taskId` causes a Prisma type conflict
    await prisma.notification.create({
      data: {
        type: payload.type,
        message: payload.message,
        isRead: false,
        userId: payload.userId,
        projectId: payload.projectId ?? null,
        taskId: payload.taskId ?? null,
      },
    });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create notification",
    );
  }
};

// ─────────────────────────────────────────────
// SEND TO MULTIPLE USERS (e.g. all project members)
// ─────────────────────────────────────────────

export const sendNotificationToMany = async (
  userIds: string[],
  payload: Omit<NotificationPayload, "userId">,
): Promise<void> => {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        type: payload.type,
        message: payload.message,
        isRead: false,
        userId,
        projectId: payload.projectId ?? null,
        taskId: payload.taskId ?? null,
      })),
    });
  } catch (error: any) {
    console.error("Error creating notifications:", error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create notifications",
    );
  }
};
