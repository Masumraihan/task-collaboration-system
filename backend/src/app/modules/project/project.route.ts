import { Router } from "express";
import { ProjectController } from "./project.controller";
import { ProjectValidation } from "./project.validation";
import auth from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  "/",
  auth(Role.PROJECT_MANAGER, Role.ADMIN),
  validateRequest(ProjectValidation.createProjectValidationSchema),
  ProjectController.createProject,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  ProjectController.getAllProjects,
);

router.get("/stats", auth(Role.ADMIN, Role.PROJECT_MANAGER), ProjectController.getProjectStats);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  ProjectController.getProjectById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest(ProjectValidation.updateProjectValidationSchema),
  ProjectController.updateProject,
);

router.delete("/:id", auth(Role.ADMIN, Role.PROJECT_MANAGER), ProjectController.deleteProject);

// ─────────────────────────────────────────────────────────────────────────────
// TEAM MEMBER ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  "/members/add",
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest(ProjectValidation.addTeamMemberValidationSchema),
  ProjectController.addTeamMember,
);

router.delete(
  "/:projectId/members/:userId",
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  ProjectController.removeTeamMember,
);

router.get(
  "/:projectId/members",
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  ProjectController.getProjectMembers,
);

router.get(
  "/members/:memberId/tasks",
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  ProjectController.getTeamMemberTasks,
);

// ─────────────────────────────────────────────────────────────────────────────
// TASK ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  "/tasks",
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest(ProjectValidation.createTaskValidationSchema),
  ProjectController.createTask,
);

router.get(
  "/tasks",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  ProjectController.getAllTasks,
);

router.get(
  "/tasks/stats",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  ProjectController.getTaskStats,
);

router.get(
  "/tasks/:id",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  ProjectController.getTaskById,
);

router.patch(
  "/tasks/:id",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  validateRequest(ProjectValidation.updateTaskValidationSchema),
  ProjectController.updateTask,
);

router.delete("/tasks/:id", auth(Role.ADMIN, Role.PROJECT_MANAGER), ProjectController.deleteTask);

router.patch(
  "/tasks/:id/assign",
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest(ProjectValidation.assignTaskValidationSchema),
  ProjectController.assignTaskToTeamMember,
);

// ─────────────────────────────────────────────────────────────────────────────
// COMMENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  "/tasks/:taskId/comments",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  validateRequest(ProjectValidation.addCommentValidationSchema),
  ProjectController.addComment,
);

router.delete(
  "/comments/:commentId",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  ProjectController.deleteComment,
);

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/activities",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  ProjectController.getActivityLogs,
);

router.get(
  "/activities/recent",
  auth(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  ProjectController.getRecentActivities,
);

// ─────────────────────────────────────────────────────────────────────────────

export const ProjectRoutes = router;
