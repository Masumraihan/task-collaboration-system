import { z } from "zod";
import { ProjectStatus, TaskPriority, TaskStatus } from "../../../generated/prisma/enums";

// ─────────────────────────────────────────────
// PROJECT VALIDATIONS
// ─────────────────────────────────────────────

const createProjectValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: "Project name is required" })
        .min(3, "Name must be at least 3 characters")
        .max(100, "Name must be at most 100 characters"),
      description: z.string().optional(),
      deadline: z
        .string({ required_error: "Deadline is required" })
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid deadline date" }),
      status: z
        .enum([...Object.keys(ProjectStatus)] as [string, ...string[]], {
          message: "Status must be ACTIVE, COMPLETED or ON_HOLD",
        })
        .optional(),
    })
    .strict(),
});

const updateProjectValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(3, "Name must be at least 3 characters")
        .max(100, "Name must be at most 100 characters")
        .optional(),
      description: z.string().optional(),
      deadline: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid deadline date" })
        .optional(),
      status: z
        .enum([...Object.keys(ProjectStatus)] as [string, ...string[]], {
          message: "Status must be ACTIVE, COMPLETED or ON_HOLD",
        })
        .optional(),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// TASK VALIDATIONS
// ─────────────────────────────────────────────

const createTaskValidationSchema = z.object({
  body: z
    .object({
      title: z
        .string({ required_error: "Task title is required" })
        .min(3, "Title must be at least 3 characters")
        .max(150, "Title must be at most 150 characters"),
      description: z.string().optional(),
      projectId: z.string({ required_error: "Project ID is required" }),
      assigneeId: z.string().optional(),
      dueDate: z
        .string({ required_error: "Due date is required" })
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid due date" }),
      priority: z
        .enum([...Object.keys(TaskPriority)] as [string, ...string[]], {
          message: "Priority must be HIGH, MEDIUM or LOW",
        })
        .optional(),
      status: z
        .enum([...Object.keys(TaskStatus)] as [string, ...string[]], {
          message: "Status must be TODO, IN_PROGRESS or COMPLETED",
        })
        .optional(),
    })
    .strict(),
});

const updateTaskValidationSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(150, "Title must be at most 150 characters")
        .optional(),
      description: z.string().optional(),
      dueDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid due date" })
        .optional(),
      priority: z
        .enum([...Object.keys(TaskPriority)] as [string, ...string[]], {
          message: "Priority must be HIGH, MEDIUM or LOW",
        })
        .optional(),
      status: z
        .enum([...Object.keys(TaskStatus)] as [string, ...string[]], {
          message: "Status must be TODO, IN_PROGRESS or COMPLETED",
        })
        .optional(),
      assigneeId: z.string().optional(),
    })
    .strict(),
});

const assignTaskValidationSchema = z.object({
  body: z
    .object({
      assigneeId: z.string({ required_error: "Assignee ID is required" }),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// COMMENT VALIDATIONS
// ─────────────────────────────────────────────

const addCommentValidationSchema = z.object({
  body: z
    .object({
      body: z
        .string({ required_error: "Comment body is required" })
        .min(1, "Comment cannot be empty"),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// TEAM MEMBER VALIDATIONS
// ─────────────────────────────────────────────

const addTeamMemberValidationSchema = z.object({
  body: z
    .object({
      userId: z.string({ required_error: "User ID is required" }),
      projectId: z.string({ required_error: "Project ID is required" }),
    })
    .strict(),
});

// ─────────────────────────────────────────────

export const ProjectValidation = {
  createProjectValidationSchema,
  updateProjectValidationSchema,
  createTaskValidationSchema,
  updateTaskValidationSchema,
  assignTaskValidationSchema,
  addCommentValidationSchema,
  addTeamMemberValidationSchema,
};
