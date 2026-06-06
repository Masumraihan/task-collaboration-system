import { StatusCodes } from "http-status-codes";
import catchAsync from "../../lib/catchAsync";
import sendResponse from "../../lib/sendResponse";
import { CustomRequest } from "../../types/common";
import { ProjectService } from "./project.service";
import pick from "../../lib/pick";

// Allowed pagination & filter fields
const PaginationOption = ["page", "limit", "sortBy", "sortOrder"];
const projectFilterFields = ["searchTerm", "status", "deadlineStatus"];
const taskFilterFields = [
  "searchTerm",
  "status",
  "priority",
  "projectId",
  "assigneeId",
  "deadlineStatus",
];
const memberFilterFields = ["searchTerm"];
const activityFilterFields = ["projectId", "action"];

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

const createProject = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.createProject(user, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Project created successfully",
    data: result,
  });
});

const getAllProjects = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const options = pick(req.query, PaginationOption);
  const filters = pick(req.query, projectFilterFields);

  const result = await ProjectService.getAllProjects(user, filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Projects fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getProjectById = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.getProjectById(user, req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project fetched successfully",
    data: result,
  });
});

const updateProject = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.updateProject(user, req.params.id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project updated successfully",
    data: result,
  });
});

const deleteProject = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  await ProjectService.deleteProject(user, req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project deleted successfully",
    data: null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

const createTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.createTask(user, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Task created successfully",
    data: result,
  });
});

const getAllTasks = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const options = pick(req.query, PaginationOption);
  const filters = pick(req.query, taskFilterFields);

  const result = await ProjectService.getAllTasks(user, filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tasks fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getTaskById = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.getTaskById(user, req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task fetched successfully",
    data: result,
  });
});

const updateTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.updateTask(user, req.params.id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task updated successfully",
    data: result,
  });
});

const deleteTask = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  await ProjectService.deleteTask(user, req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task deleted successfully",
    data: null,
  });
});

const assignTaskToTeamMember = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const { assigneeId } = req.body;
  const result = await ProjectService.assignTaskToTeamMember(user, req.params.id, assigneeId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task assigned successfully",
    data: result,
  });
});

const getTeamMemberTasks = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const options = pick(req.query, PaginationOption);
  const filters = pick(req.query, taskFilterFields);
  const result = await ProjectService.getTeamMemberTasks(
    user,
    req.params.memberId,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Member tasks fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// COMMENT CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

const addComment = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.addComment(user, req.params.taskId, req.body.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Comment added successfully",
    data: result,
  });
});

const deleteComment = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  await ProjectService.deleteComment(user, req.params.commentId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Comment deleted successfully",
    data: null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEAM MEMBER CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

const addTeamMember = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const { userId, projectId } = req.body;
  const result = await ProjectService.addTeamMember(user, userId, projectId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Team member added successfully",
    data: result,
  });
});

const removeTeamMember = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.removeTeamMember(
    user,
    req.params.userId,
    req.params.projectId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Team member removed successfully",
    data: result,
  });
});

const getProjectMembers = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const options = pick(req.query, PaginationOption);
  const filters = pick(req.query, memberFilterFields);
  const result = await ProjectService.getProjectMembers(
    user,
    req.params.projectId,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project members fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

const getProjectStats = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.getProjectStats(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Project stats fetched successfully",
    data: result,
  });
});

const getTaskStats = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.getTaskStats(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Task stats fetched successfully",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

const getActivityLogs = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const options = pick(req.query, PaginationOption);
  const filters = pick(req.query, activityFilterFields);
  const result = await ProjectService.getActivityLogs(user, filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Activity logs fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getRecentActivities = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ProjectService.getRecentActivities(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Recent activities fetched successfully",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────────────────────

export const ProjectController = {
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
