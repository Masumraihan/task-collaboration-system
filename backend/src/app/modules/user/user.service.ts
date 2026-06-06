import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import config from "../../config";
import AppError from "../../errors/AppError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import { userSearchableFields } from "./user.constant";
import { Prisma, Role, Task, User } from "../../../generated/prisma/client";
import prisma from "../../lib/prisma";

// ─────────────────────────────────────────────
// CREATE USER (admin creates a user directly — pre-verified)
// ─────────────────────────────────────────────

const createUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: Role;
  avatarUrl?: string;
}) => {
  // Check duplicate email
  const isUserExist = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already exists with this email");
  }

  const result = await prisma.$transaction(async (tx) => {
    const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));

    const user = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash: hashedPassword,
        role: payload.role ?? Role.TEAM_MEMBER,
        avatarUrl: payload.avatarUrl ?? null,
        isActive: true,
      },
    });

    // Admin-created users are pre-verified
    await tx.validation.create({
      data: {
        otp: null,
        isVerified: true,
        expiresAt: null,
        userId: user.id,
      },
    });

    return user;
  });

  return result;
};

// ─────────────────────────────────────────────
// GET ALL USERS (admin — paginated + searchable)
// ─────────────────────────────────────────────

const getUsers = async (query: Record<string, unknown>, options: TPaginationOptions) => {
  const andConditions: Prisma.UserWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm, isVerified, ...filterQuery } = query;

  // Search by name or email
  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: { contains: searchTerm as string, mode: "insensitive" },
      })),
    });
  }

  // Additional filter fields (role, isActive, etc.)
  if (Object.keys(filterQuery).length > 0) {
    andConditions.push({
      AND: Object.entries(filterQuery).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  // Filter by verification status
  if (isVerified !== undefined) {
    andConditions.push({
      validation: { isVerified: isVerified === "true" },
    });
  }

  const whereConditions: Prisma.UserWhereInput = {
    AND: andConditions.length ? andConditions : undefined,
    // Exclude admins from the list
    NOT: { role: Role.ADMIN },
  };

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      validation: {
        select: { isVerified: true, id: true },
      },
    },
  });

  const total = await prisma.user.count({ where: whereConditions });
  const meta = paginationHelper.generatePaginationMeta({ page, limit, total });

  return { meta, data: result };
};

// ─────────────────────────────────────────────
// GET SINGLE USER
// ─────────────────────────────────────────────

const getUser = async (id: string) => {
  const result = await prisma.user.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      project: {
        select: { id: true, name: true, status: true },
      },
      validation: {
        select: { isVerified: true },
      },
      assignedTasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
      },
    },
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return result;
};

// ─────────────────────────────────────────────
// GET MY PROFILE
// ─────────────────────────────────────────────

const getMyProfile = async (user: TTokenUser) => {
  const result = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      project: {
        select: { id: true, name: true, status: true, deadline: true },
      },
      assignedTasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
        },
      },
      validation: {
        select: { isVerified: true },
      },
    },
  });

  return result;
};

// ─────────────────────────────────────────────
// UPDATE MY PROFILE
// ─────────────────────────────────────────────

const updateMyProfile = async (
  user: TTokenUser,
  payload: Partial<Pick<User, "name" | "avatarUrl">>,
) => {
  const userExist = await prisma.user.findFirst({
    where: { id: user.id },
  });

  if (!userExist) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (!userExist.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Account is blocked");
  }

  const result = await prisma.user.update({
    where: { id: user.id },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return result;
};

// ─────────────────────────────────────────────
// UPDATE USER (admin)
// ─────────────────────────────────────────────

const updateUser = async (
  id: string,
  payload: Partial<Pick<User, "name" | "email" | "role" | "avatarUrl" | "isActive">>,
) => {
  const userExist = await prisma.user.findFirst({ where: { id } });

  if (!userExist) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: { id },
    data: payload,
  });

  return result;
};

// ─────────────────────────────────────────────
// DELETE USER (admin — hard delete)
// ─────────────────────────────────────────────

const deleteUser = async (id: string) => {
  const userExist = await prisma.user.findFirst({ where: { id } });

  if (!userExist) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.delete({ where: { id } });

  return result;
};

// ─────────────────────────────────────────────
// DELETE MY PROFILE (soft delete — deactivate)
// ─────────────────────────────────────────────

const deleteMyProfile = async (user: TTokenUser) => {
  const userExist = await prisma.user.findFirst({ where: { id: user.id } });

  if (!userExist) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Soft delete by deactivating the account
  const result = await prisma.user.update({
    where: { id: user.id },
    data: { isActive: false },
  });

  return result;
};

// ─────────────────────────────────────────────
// MARK USER AS VERIFIED (admin)
// ─────────────────────────────────────────────

const markAsVerified = async (id: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: { validation: true },
  });

  if (!user.validation) {
    throw new AppError(StatusCodes.NOT_FOUND, "Validation record not found for this user");
  }

  await prisma.validation.update({
    where: { id: user.validation.id },
    data: { isVerified: true, otp: null, expiresAt: null },
  });
};

// ─────────────────────────────────────────────
// WORKLOAD SUMMARY — tasks per member
// ─────────────────────────────────────────────

const getMemberWorkloadSummary = async (projectId?: string) => {
  const whereCondition: Prisma.UserWhereInput = projectId
    ? { projectId }
    : { NOT: { role: Role.ADMIN } };

  const members = await prisma.user.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      assignedTasks: {
        select: { status: true },
      },
    },
  });

  // No explicit type annotation on member — TypeScript infers it from the select above
  return members.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    avatarUrl: member.avatarUrl,
    role: member.role,
    isActive: member.isActive,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    projectId: member.projectId,
    totalTasks: member.assignedTasks.length,
    completedTasks: member.assignedTasks.filter((t) => t.status === "COMPLETED").length,
    pendingTasks: member.assignedTasks.filter((t) => t.status !== "COMPLETED").length,
  }));
};

// ─────────────────────────────────────────────

export const UserServices = {
  createUser,
  getUsers,
  getUser,
  getMyProfile,
  updateMyProfile,
  updateUser,
  deleteUser,
  deleteMyProfile,
  markAsVerified,
  getMemberWorkloadSummary,
};
