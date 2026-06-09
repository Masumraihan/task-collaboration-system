// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export type Role = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";
export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "PROJECT_DEADLINE_SOON"
  | "MEMBER_ADDED_TO_PROJECT"
  | "COMMENT_ADDED";

export type ActivityAction =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_DELETED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TASK_STATUS_CHANGED"
  | "TASK_ASSIGNED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "COMMENT_ADDED";

// ─────────────────────────────────────────────
// API RESPONSE
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  isActive: boolean;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────────
// PROJECT
// ─────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  deadline: string;
  status: ProjectStatus;
  ownerId: string;
  owner: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  members: Pick<User, "id" | "name" | "email" | "avatarUrl" | "role">[];
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  overdue: number;
  projectSummaries: ProjectSummary[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  daysUntilDeadline: number;
  deadline: string;
}

// ─────────────────────────────────────────────
// TASK
// ─────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  projectId: string;
  project: Pick<Project, "id" | "name">;
  creatorId: string;
  creator: Pick<User, "id" | "name" | "avatarUrl">;
  assigneeId?: string | null;
  assignee?: Pick<User, "id" | "name" | "avatarUrl"> | null;
  comments?: Comment[];
  _count?: { comments: number };
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byPriority: { high: number; medium: number; low: number };
  upcomingDeadlines: Partial<Task>[];
  highPriorityTasks: Partial<Task>[];
}

// ─────────────────────────────────────────────
// COMMENT
// ─────────────────────────────────────────────

export interface Comment {
  id: string;
  body: string;
  taskId: string;
  authorId: string;
  author: Pick<User, "id" | "name" | "avatarUrl">;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// ACTIVITY LOG
// ─────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  description: string;
  actorId: string;
  actor: Pick<User, "id" | "name" | "avatarUrl">;
  projectId?: string | null;
  project?: Pick<Project, "id" | "name"> | null;
  taskId?: string | null;
  task?: Pick<Task, "id" | "title"> | null;
  createdAt: string;
}

// ─────────────────────────────────────────────
// MEMBER WORKLOAD
// ─────────────────────────────────────────────

export interface MemberWorkload {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: Role;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

// ─────────────────────────────────────────────
// PAGINATION QUERY
// ─────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProjectQuery extends PaginationQuery {
  searchTerm?: string;
  status?: ProjectStatus;
  deadlineStatus?: "upcoming" | "overdue";
}

export interface TaskQuery extends PaginationQuery {
  searchTerm?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
  deadlineStatus?: "upcoming" | "overdue";
}