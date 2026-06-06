import AppError from "../../errors/AppError";
import { paginationHelper } from "../../helpers/paginationHelper";
import prisma from "../../lib/prisma";
import { TTokenUser } from "../../types/common";
import { TPaginationOptions } from "../../types/pagination";
import { StatusCodes } from "http-status-codes";
import { NotificationServices } from "../notification/notification.service";
import {
  ActivityAction,
  NotificationType,
  ProjectStatus,
  Role,
  TaskPriority,
  TaskStatus,
} from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const logActivity = async (data: {
  action: ActivityAction;
  description: string;
  actorId: string;
  projectId?: string;
  taskId?: string;
}) => {
  await prisma.activityLog.create({ data });
};

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// CREATE PROJECT (Project Manager only)
const createProject = async (
  user: TTokenUser,
  payload: {
    name: string;
    description?: string;
    deadline: Date;
    status?: ProjectStatus;
  },
) => {
  if (user.role !== Role.PROJECT_MANAGER && user.role !== Role.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only Project Managers can create projects");
  }

  if (new Date(payload.deadline) < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please select a valid deadline");
  }

  const project = await prisma.project.create({
    data: {
      name: payload.name,
      description: payload.description,
      deadline: new Date(payload.deadline),
      status: payload.status ?? ProjectStatus.ACTIVE,
      ownerId: user.id,
    },
  });

  await logActivity({
    action: ActivityAction.PROJECT_CREATED,
    description: `Project "${project.name}" was created`,
    actorId: user.id,
    projectId: project.id,
  });

  return project;
};

// GET ALL PROJECTS (paginated + searchable + filterable)
const getAllProjects = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm, status, deadlineStatus } = query;

  const andConditions: Prisma.ProjectWhereInput[] = [];

  if (user.role === Role.PROJECT_MANAGER) {
    andConditions.push({ ownerId: user.id });
  }

  if (searchTerm) {
    andConditions.push({ name: { contains: searchTerm as string, mode: "insensitive" } });
  }

  if (status) {
    andConditions.push({ status: status as ProjectStatus });
  }

  if (deadlineStatus === "overdue") {
    andConditions.push({ deadline: { lt: new Date() }, status: { not: ProjectStatus.COMPLETED } });
  } else if (deadlineStatus === "upcoming") {
    andConditions.push({ deadline: { gte: new Date() } });
  }

  const whereConditions: Prisma.ProjectWhereInput = andConditions.length
    ? { AND: andConditions }
    : {};

  const [result, total] = await Promise.all([
    prisma.project.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        _count: { select: { tasks: true } },
      },
    }),
    prisma.project.count({ where: whereConditions }),
  ]);

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: result,
  };
};

// GET PROJECT BY ID
const getProjectById = async (user: TTokenUser, id: string) => {
  const project = await prisma.project.findFirst({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { tasks: true, members: true } },
    },
  });

  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found");
  }

  if (user.role === Role.TEAM_MEMBER && project.members.every((m) => m.id !== user.id)) {
    throw new AppError(StatusCodes.FORBIDDEN, "You are not a member of this project");
  }

  return project;
};

// UPDATE PROJECT
const updateProject = async (
  user: TTokenUser,
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    deadline: Date;
    status: ProjectStatus;
  }>,
) => {
  const project = await prisma.project.findFirst({ where: { id } });

  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found");
  }

  if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only update your own projects");
  }

  if (user.role === Role.TEAM_MEMBER) {
    throw new AppError(StatusCodes.FORBIDDEN, "Team members cannot update projects");
  }

  if (payload.deadline && new Date(payload.deadline) < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please select a valid deadline");
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...payload,
      ...(payload.deadline && { deadline: new Date(payload.deadline) }),
    },
  });

  await logActivity({
    action: ActivityAction.PROJECT_UPDATED,
    description: `Project "${updated.name}" was updated`,
    actorId: user.id,
    projectId: id,
  });

  return updated;
};

// DELETE PROJECT
const deleteProject = async (user: TTokenUser, id: string) => {
  const project = await prisma.project.findFirst({ where: { id } });

  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found");
  }

  if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only delete your own projects");
  }

  if (user.role === Role.TEAM_MEMBER) {
    throw new AppError(StatusCodes.FORBIDDEN, "Team members cannot delete projects");
  }

  await prisma.project.delete({ where: { id } });

  await logActivity({
    action: ActivityAction.PROJECT_DELETED,
    description: `Project "${project.name}" was deleted`,
    actorId: user.id,
  });

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// TASK FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// CREATE TASK
const createTask = async (
  user: TTokenUser,
  payload: {
    title: string;
    description?: string;
    projectId: string;
    assigneeId?: string;
    dueDate: Date;
    priority?: TaskPriority;
    status?: TaskStatus;
  },
) => {
  if (user.role === Role.TEAM_MEMBER) {
    throw new AppError(StatusCodes.FORBIDDEN, "Team members cannot create tasks");
  }

  const project = await prisma.project.findFirst({ where: { id: payload.projectId } });
  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found");
  }

  if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only create tasks in your own projects");
  }

  if (new Date(payload.dueDate) < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please select a valid deadline");
  }

  const duplicate = await prisma.task.findFirst({
    where: {
      projectId: payload.projectId,
      title: { equals: payload.title, mode: "insensitive" },
    },
  });
  if (duplicate) {
    throw new AppError(StatusCodes.BAD_REQUEST, "This task already exists in the project");
  }

  if (payload.assigneeId) {
    const isMember = await prisma.user.findFirst({
      where: { id: payload.assigneeId, projectId: payload.projectId },
    });
    if (!isMember) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Assignee is not a member of this project");
    }
  }

  const task = await prisma.task.create({
    data: {
      title: payload.title,
      description: payload.description,
      projectId: payload.projectId,
      creatorId: user.id,
      assigneeId: payload.assigneeId ?? null,
      dueDate: new Date(payload.dueDate),
      priority: payload.priority ?? TaskPriority.MEDIUM,
      status: payload.status ?? TaskStatus.TODO,
    },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await logActivity({
    action: ActivityAction.TASK_CREATED,
    description: `Task "${task.title}" was created in project "${task.project.name}"`,
    actorId: user.id,
    projectId: payload.projectId,
    taskId: task.id,
  });

  if (payload.assigneeId) {
    await logActivity({
      action: ActivityAction.TASK_ASSIGNED,
      description: `Task "${task.title}" was assigned to ${task.assignee?.name}`,
      actorId: user.id,
      projectId: payload.projectId,
      taskId: task.id,
    });

    await NotificationServices.sendNotification({
      type: NotificationType.TASK_ASSIGNED,
      message: `You have been assigned to task "${task.title}" in project "${task.project.name}"`,
      userId: payload.assigneeId,
      projectId: payload.projectId,
      taskId: task.id,
    });
  }

  return task;
};

// GET ALL TASKS (paginated + searchable + filterable)
const getAllTasks = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm, status, priority, projectId, assigneeId, deadlineStatus } = query;

  const andConditions: Prisma.TaskWhereInput[] = [];

  // Team members only see their assigned tasks
  if (user.role === Role.TEAM_MEMBER) {
    andConditions.push({ assigneeId: user.id });
  }

  // Project Manager sees tasks only in their projects
  if (user.role === Role.PROJECT_MANAGER) {
    andConditions.push({ project: { ownerId: user.id } });
  }

  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm as string, mode: "insensitive" } },
        { description: { contains: searchTerm as string, mode: "insensitive" } },
      ],
    });
  }

  if (status) andConditions.push({ status: status as TaskStatus });
  if (priority) andConditions.push({ priority: priority as TaskPriority });
  if (projectId) andConditions.push({ projectId: projectId as string });
  if (assigneeId) andConditions.push({ assigneeId: assigneeId as string });

  if (deadlineStatus === "overdue") {
    andConditions.push({ dueDate: { lt: new Date() }, status: { not: TaskStatus.COMPLETED } });
  } else if (deadlineStatus === "upcoming") {
    andConditions.push({ dueDate: { gte: new Date() } });
  }

  const whereConditions: Prisma.TaskWhereInput = andConditions.length ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.task.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.task.count({ where: whereConditions }),
  ]);

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: result,
  };
};

// GET TASK BY ID
const getTaskById = async (user: TTokenUser, id: string) => {
  const task = await prisma.task.findFirst({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true, status: true } },
      comments: {
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!task) {
    throw new AppError(StatusCodes.NOT_FOUND, "Task not found");
  }

  if (user.role === Role.TEAM_MEMBER && task.assigneeId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You do not have access to this task");
  }

  return task;
};

// UPDATE TASK
const updateTask = async (
  user: TTokenUser,
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    dueDate: Date;
    priority: TaskPriority;
    status: TaskStatus;
    assigneeId: string;
  }>,
) => {
  const task = await prisma.task.findFirst({
    where: { id },
    include: { project: true, assignee: true },
  });

  if (!task) {
    throw new AppError(StatusCodes.NOT_FOUND, "Task not found");
  }

  // Team member: only update status on their own assigned task
  if (user.role === Role.TEAM_MEMBER) {
    if (task.assigneeId !== user.id) {
      throw new AppError(StatusCodes.FORBIDDEN, "You can only update tasks assigned to you");
    }
    const disallowed = Object.keys(payload).filter((k) => k !== "status");
    if (disallowed.length > 0) {
      throw new AppError(StatusCodes.FORBIDDEN, "Team members can only update task status");
    }
  }

  if (payload.dueDate && new Date(payload.dueDate) < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Please select a valid deadline");
  }

  if (payload.title && payload.title !== task.title) {
    const duplicate = await prisma.task.findFirst({
      where: {
        projectId: task.projectId,
        title: { equals: payload.title, mode: "insensitive" },
        NOT: { id },
      },
    });
    if (duplicate) {
      throw new AppError(StatusCodes.BAD_REQUEST, "This task already exists in the project");
    }
  }

  if (payload.assigneeId && task.status === TaskStatus.COMPLETED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Completed tasks cannot be reassigned");
  }

  if (payload.assigneeId) {
    const isMember = await prisma.user.findFirst({
      where: { id: payload.assigneeId, projectId: task.projectId },
    });
    if (!isMember) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Assignee is not a member of this project");
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...payload,
      ...(payload.dueDate && { dueDate: new Date(payload.dueDate) }),
    },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await logActivity({
    action: ActivityAction.TASK_UPDATED,
    description: `Task "${updated.title}" was updated`,
    actorId: user.id,
    projectId: task.projectId,
    taskId: id,
  });

  if (payload.status && payload.status !== task.status) {
    await logActivity({
      action: ActivityAction.TASK_STATUS_CHANGED,
      description: `Task "${updated.title}" status changed to ${payload.status}`,
      actorId: user.id,
      projectId: task.projectId,
      taskId: id,
    });

    if (updated.assigneeId) {
      await NotificationServices.sendNotification({
        type: NotificationType.TASK_STATUS_CHANGED,
        message: `Task "${updated.title}" status changed to ${payload.status}`,
        userId: updated.assigneeId,
        projectId: task.projectId,
        taskId: id,
      });
    }
  }

  if (payload.assigneeId && payload.assigneeId !== task.assigneeId) {
    await logActivity({
      action: ActivityAction.TASK_ASSIGNED,
      description: `Task "${updated.title}" was assigned to ${updated.assignee?.name}`,
      actorId: user.id,
      projectId: task.projectId,
      taskId: id,
    });

    await NotificationServices.sendNotification({
      type: NotificationType.TASK_ASSIGNED,
      message: `You have been assigned to task "${updated.title}" in project "${updated.project.name}"`,
      userId: payload.assigneeId,
      projectId: task.projectId,
      taskId: id,
    });
  }

  return updated;
};

// DELETE TASK
const deleteTask = async (user: TTokenUser, id: string) => {
  if (user.role === Role.TEAM_MEMBER) {
    throw new AppError(StatusCodes.FORBIDDEN, "Team members cannot delete tasks");
  }

  const task = await prisma.task.findFirst({
    where: { id },
    include: { project: true },
  });

  if (!task) {
    throw new AppError(StatusCodes.NOT_FOUND, "Task not found");
  }

  if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only delete tasks in your own projects");
  }

  await prisma.task.delete({ where: { id } });

  await logActivity({
    action: ActivityAction.TASK_DELETED,
    description: `Task "${task.title}" was deleted from project "${task.project.name}"`,
    actorId: user.id,
    projectId: task.projectId,
  });

  return null;
};

// ASSIGN TASK TO TEAM MEMBER
const assignTaskToTeamMember = async (user: TTokenUser, taskId: string, assigneeId: string) => {
  if (user.role === Role.TEAM_MEMBER) {
    throw new AppError(StatusCodes.FORBIDDEN, "Team members cannot assign tasks");
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId },
    include: { project: true, assignee: true },
  });

  if (!task) {
    throw new AppError(StatusCodes.NOT_FOUND, "Task not found");
  }

  if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only assign tasks in your own projects");
  }

  if (task.status === TaskStatus.COMPLETED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Completed tasks cannot be reassigned");
  }

  const isMember = await prisma.user.findFirst({
    where: { id: assigneeId, projectId: task.projectId },
  });
  if (!isMember) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Assignee is not a member of this project");
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await logActivity({
    action: ActivityAction.TASK_ASSIGNED,
    description: `Task "${task.title}" was assigned to ${updated.assignee?.name}`,
    actorId: user.id,
    projectId: task.projectId,
    taskId,
  });

  await NotificationServices.sendNotification({
    type: NotificationType.TASK_ASSIGNED,
    message: `You have been assigned to task "${task.title}" in project "${task.project.name}"`,
    userId: assigneeId,
    projectId: task.projectId,
    taskId,
  });

  return updated;
};

// GET TEAM MEMBER TASKS (for PM/Admin viewing a specific member)
const getTeamMemberTasks = async (
  user: TTokenUser,
  memberId: string,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  if (user.role === Role.TEAM_MEMBER) {
    throw new AppError(StatusCodes.FORBIDDEN, "Team members cannot view other members tasks");
  }

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { status, priority, projectId } = query;

  const andConditions: Prisma.TaskWhereInput[] = [{ assigneeId: memberId }];

  if (status) andConditions.push({ status: status as TaskStatus });
  if (priority) andConditions.push({ priority: priority as TaskPriority });
  if (projectId) andConditions.push({ projectId: projectId as string });

  const whereConditions: Prisma.TaskWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.task.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    prisma.task.count({ where: whereConditions }),
  ]);

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: result,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMENT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ADD COMMENT
const addComment = async (user: TTokenUser, taskId: string, body: string) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task) {
    throw new AppError(StatusCodes.NOT_FOUND, "Task not found");
  }

  if (user.role === Role.TEAM_MEMBER && task.assigneeId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only comment on tasks assigned to you");
  }

  const comment = await prisma.comment.create({
    data: { body, taskId, authorId: user.id },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  await logActivity({
    action: ActivityAction.COMMENT_ADDED,
    description: `Comment added to task "${task.title}"`,
    actorId: user.id,
    projectId: task.projectId,
    taskId,
  });

  if (task.assigneeId && task.assigneeId !== user.id) {
    await NotificationServices.sendNotification({
      type: NotificationType.COMMENT_ADDED,
      message: `New comment added to task "${task.title}"`,
      userId: task.assigneeId,
      projectId: task.projectId,
      taskId,
    });
  }

  return comment;
};

// DELETE COMMENT
const deleteComment = async (user: TTokenUser, commentId: string) => {
  const comment = await prisma.comment.findFirst({ where: { id: commentId } });

  if (!comment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Comment not found");
  }

  if (user.role !== Role.ADMIN && comment.authorId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only delete your own comments");
  }

  await prisma.comment.delete({ where: { id: commentId } });

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// TEAM MEMBER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ADD TEAM MEMBER TO PROJECT
const addTeamMember = async (user: TTokenUser, userId: string, projectId: string) => {
  if (user.role === Role.TEAM_MEMBER) {
    throw new AppError(StatusCodes.FORBIDDEN, "Team members cannot add members to projects");
  }

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found");
  }

  if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only add members to your own projects");
  }

  const member = await prisma.user.findFirst({ where: { id: userId } });
  if (!member) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (member.projectId && member.projectId !== projectId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This user is already a member of another project. Remove them first",
    );
  }

  if (member.projectId === projectId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is already a member of this project");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { projectId },
    select: { id: true, name: true, email: true, avatarUrl: true, role: true },
  });

  await logActivity({
    action: ActivityAction.MEMBER_ADDED,
    description: `${member.name} was added to project "${project.name}"`,
    actorId: user.id,
    projectId,
  });

  await NotificationServices.sendNotification({
    type: NotificationType.MEMBER_ADDED_TO_PROJECT,
    message: `You have been added to project "${project.name}"`,
    userId,
    projectId,
  });

  return updated;
};

// REMOVE TEAM MEMBER FROM PROJECT
const removeTeamMember = async (user: TTokenUser, userId: string, projectId: string) => {
  if (user.role === Role.TEAM_MEMBER) {
    throw new AppError(StatusCodes.FORBIDDEN, "Team members cannot remove members from projects");
  }

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found");
  }

  if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only remove members from your own projects");
  }

  const member = await prisma.user.findFirst({ where: { id: userId, projectId } });
  if (!member) {
    throw new AppError(StatusCodes.NOT_FOUND, "User is not a member of this project");
  }

  // Unassign all tasks in this project from the member
  await prisma.task.updateMany({
    where: { projectId, assigneeId: userId },
    data: { assigneeId: null },
  });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { projectId: null },
    select: { id: true, name: true, email: true },
  });

  await logActivity({
    action: ActivityAction.MEMBER_REMOVED,
    description: `${member.name} was removed from project "${project.name}"`,
    actorId: user.id,
    projectId,
  });

  return updated;
};

// GET PROJECT MEMBERS (with workload summary)
const getProjectMembers = async (
  user: TTokenUser,
  projectId: string,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    throw new AppError(StatusCodes.NOT_FOUND, "Project not found");
  }

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm } = query;

  const andConditions: Prisma.UserWhereInput[] = [{ projectId }];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm as string, mode: "insensitive" } },
        { email: { contains: searchTerm as string, mode: "insensitive" } },
      ],
    });
  }

  const whereConditions: Prisma.UserWhereInput = { AND: andConditions };

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        assignedTasks: {
          where: { projectId },
          select: { status: true },
        },
      },
    }),
    prisma.user.count({ where: whereConditions }),
  ]);

  const data = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    avatarUrl: m.avatarUrl,
    role: m.role,
    totalTasks: m.assignedTasks.length,
    completedTasks: m.assignedTasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
    pendingTasks: m.assignedTasks.filter((t) => t.status !== TaskStatus.COMPLETED).length,
  }));

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD & ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

// PROJECT STATS
const getProjectStats = async (user: TTokenUser) => {
  const ownerFilter: Prisma.ProjectWhereInput =
    user.role === Role.PROJECT_MANAGER ? { ownerId: user.id } : {};

  const [total, active, completed, onHold, overdue] = await Promise.all([
    prisma.project.count({ where: ownerFilter }),
    prisma.project.count({ where: { ...ownerFilter, status: ProjectStatus.ACTIVE } }),
    prisma.project.count({ where: { ...ownerFilter, status: ProjectStatus.COMPLETED } }),
    prisma.project.count({ where: { ...ownerFilter, status: ProjectStatus.ON_HOLD } }),
    prisma.project.count({
      where: {
        ...ownerFilter,
        deadline: { lt: new Date() },
        status: { not: ProjectStatus.COMPLETED },
      },
    }),
  ]);

  // Top 5 active projects with progress
  const projectSummaries = await prisma.project.findMany({
    where: { ...ownerFilter, status: ProjectStatus.ACTIVE },
    take: 5,
    orderBy: { deadline: "asc" },
    include: {
      tasks: { select: { status: true } },
      _count: { select: { tasks: true } },
    },
  });

  const summaries = projectSummaries.map((p) => {
    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const daysUntilDeadline = Math.ceil(
      (new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: p.id,
      name: p.name,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      completionPercentage,
      daysUntilDeadline,
      deadline: p.deadline,
    };
  });

  return { total, active, completed, onHold, overdue, projectSummaries: summaries };
};

// TASK STATS
const getTaskStats = async (user: TTokenUser) => {
  const taskFilter: Prisma.TaskWhereInput =
    user.role === Role.TEAM_MEMBER
      ? { assigneeId: user.id }
      : user.role === Role.PROJECT_MANAGER
        ? { project: { ownerId: user.id } }
        : {};

  const [total, todo, inProgress, completed, overdue] = await Promise.all([
    prisma.task.count({ where: taskFilter }),
    prisma.task.count({ where: { ...taskFilter, status: TaskStatus.TODO } }),
    prisma.task.count({ where: { ...taskFilter, status: TaskStatus.IN_PROGRESS } }),
    prisma.task.count({ where: { ...taskFilter, status: TaskStatus.COMPLETED } }),
    prisma.task.count({
      where: {
        ...taskFilter,
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.COMPLETED },
      },
    }),
  ]);

  const [highPriority, mediumPriority, lowPriority] = await Promise.all([
    prisma.task.count({ where: { ...taskFilter, priority: TaskPriority.HIGH } }),
    prisma.task.count({ where: { ...taskFilter, priority: TaskPriority.MEDIUM } }),
    prisma.task.count({ where: { ...taskFilter, priority: TaskPriority.LOW } }),
  ]);

  // Upcoming deadlines within next 7 days
  const upcomingDeadlines = await prisma.task.findMany({
    where: {
      ...taskFilter,
      dueDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      status: { not: TaskStatus.COMPLETED },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      dueDate: true,
      priority: true,
      status: true,
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // High priority incomplete tasks
  const highPriorityTasks = await prisma.task.findMany({
    where: {
      ...taskFilter,
      priority: TaskPriority.HIGH,
      status: { not: TaskStatus.COMPLETED },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return {
    total,
    todo,
    inProgress,
    completed,
    overdue,
    byPriority: { high: highPriority, medium: mediumPriority, low: lowPriority },
    upcomingDeadlines,
    highPriorityTasks,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG
// ─────────────────────────────────────────────────────────────────────────────

// GET ACTIVITY LOGS (paginated)
const getActivityLogs = async (
  user: TTokenUser,
  query: Record<string, unknown>,
  options: TPaginationOptions,
) => {
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { projectId, action } = query;

  const andConditions: Prisma.ActivityLogWhereInput[] = [];

  if (user.role === Role.PROJECT_MANAGER) {
    andConditions.push({ project: { ownerId: user.id } });
  }

  if (user.role === Role.TEAM_MEMBER) {
    andConditions.push({
      OR: [{ actorId: user.id }, { task: { assigneeId: user.id } }],
    });
  }

  if (projectId) andConditions.push({ projectId: projectId as string });
  if (action) andConditions.push({ action: action as ActivityAction });

  const whereConditions: Prisma.ActivityLogWhereInput = andConditions.length
    ? { AND: andConditions }
    : {};

  const [result, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        actor: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.activityLog.count({ where: whereConditions }),
  ]);

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: result,
  };
};

// GET RECENT ACTIVITIES (latest 10 for dashboard widget)
const getRecentActivities = async (user: TTokenUser) => {
  const andConditions: Prisma.ActivityLogWhereInput[] = [];

  if (user.role === Role.PROJECT_MANAGER) {
    andConditions.push({ project: { ownerId: user.id } });
  }

  if (user.role === Role.TEAM_MEMBER) {
    andConditions.push({
      OR: [{ actorId: user.id }, { task: { assigneeId: user.id } }],
    });
  }

  const whereConditions: Prisma.ActivityLogWhereInput = andConditions.length
    ? { AND: andConditions }
    : {};

  return prisma.activityLog.findMany({
    where: whereConditions,
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      actor: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────

export const ProjectService = {
  // Projects
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,

  // Tasks
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTaskToTeamMember,
  getTeamMemberTasks,

  // Comments
  addComment,
  deleteComment,

  // Team Members
  addTeamMember,
  removeTeamMember,
  getProjectMembers,

  // Dashboard & Analytics
  getProjectStats,
  getTaskStats,

  // Activity Logs
  getActivityLogs,
  getRecentActivities,
};
