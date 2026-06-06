import { StatusCodes } from "http-status-codes";
import prisma from "../../lib/prisma";
import AppError from "../../errors/AppError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import { NotificationType } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";

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

type TAudience = "all" | "admins" | "projectManagers" | "teamMembers";

// ─────────────────────────────────────────────
// CREATE & STORE IN-APP NOTIFICATION (single)
// ─────────────────────────────────────────────

const sendNotification = async (payload: NotificationPayload): Promise<void> => {
  try {
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

const sendNotificationToMany = async (
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

// ─────────────────────────────────────────────
// GET NOTIFICATIONS (paginated + filterable)
// ─────────────────────────────────────────────

const getNotificationFromDb = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { ...filterQuery } = query;

  const andConditions: Prisma.NotificationWhereInput[] = [];

  // Always scope to the current user
  andConditions.push({ userId: user.id });

  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => {
        if (key === "isRead") {
          return { [key]: { equals: value === "true" } };
        }
        return { [key]: { equals: value } };
      }),
    });
  }

  const whereConditions: Prisma.NotificationWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.notification.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        type: true,
        message: true,
        isRead: true,
        projectId: true,
        taskId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.notification.count({ where: whereConditions }),
  ]);

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: result,
  };
};

// ─────────────────────────────────────────────
// MARK AS READ (single or all)
// ─────────────────────────────────────────────

const readNotificationFromDb = async (user: TTokenUser, id?: string) => {
  // If id provided — mark single notification as read
  // Otherwise — mark all user's notifications as read
  const result = await prisma.notification.updateMany({
    where: {
      userId: user.id,
      ...(id && { id }),
    },
    data: { isRead: true },
  });

  return result;
};

// ─────────────────────────────────────────────
// DELETE SINGLE NOTIFICATION
// ─────────────────────────────────────────────

const deleteNotificationFromDb = async (user: TTokenUser, id: string) => {
  const result = await prisma.notification.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  return result;
};

// ─────────────────────────────────────────────
// DELETE ALL NOTIFICATIONS FOR USER
// ─────────────────────────────────────────────

const deleteAllNotificationFromDb = async (user: TTokenUser) => {
  const result = await prisma.notification.deleteMany({
    where: { userId: user.id },
  });

  return result;
};

// ─────────────────────────────────────────────
// BROADCAST TO ROLE-BASED AUDIENCE (admin only)
// ─────────────────────────────────────────────

const AUDIENCE_WHERE_MAP: Record<TAudience, Prisma.UserWhereInput> = {
  all: { isActive: true, isDelete: false },
  admins: { isActive: true, isDelete: false, role: "ADMIN" },
  projectManagers: { isActive: true, isDelete: false, role: "PROJECT_MANAGER" },
  teamMembers: { isActive: true, isDelete: false, role: "TEAM_MEMBER" },
};

const createBroadcastNotification = async (payload: {
  targetedAudience: TAudience;
  type: NotificationType;
  message: string;
  projectId?: string;
  taskId?: string;
}) => {
  const where = AUDIENCE_WHERE_MAP[payload.targetedAudience];
  if (!where) return;

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  if (!users.length) return;

  await prisma.notification.createMany({
    data: users.map((user) => ({
      type: payload.type,
      message: payload.message,
      isRead: false,
      userId: user.id,
      projectId: payload.projectId ?? null,
      taskId: payload.taskId ?? null,
    })),
  });
};

const createTest = async (user: TTokenUser) => {
  await prisma.notification.create({
    data: {
      type: "COMMENT_ADDED",
      message: "Test notification",
      isRead: false,
      userId: user.id,
    },
  });
};

// ─────────────────────────────────────────────

export const NotificationServices = {
  sendNotification,
  sendNotificationToMany,
  getNotificationFromDb,
  readNotificationFromDb,
  deleteNotificationFromDb,
  deleteAllNotificationFromDb,
  createBroadcastNotification,
  createTest,
};
