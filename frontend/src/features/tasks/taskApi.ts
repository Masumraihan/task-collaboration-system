import { baseApi } from "@/lib/baseApi";
import type { ApiResponse, Task, TaskStats, TaskQuery } from "@/types";

interface PaginatedResponse<T> {
  meta: { page: number; limit: number; total: number; totalPage: number };
  data: T[];
}

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTask: builder.mutation<
      ApiResponse<Task>,
      {
        title: string;
        description?: string;
        projectId: string;
        assigneeId?: string;
        dueDate: string;
        priority?: string;
        status?: string;
      }
    >({
      query: (body) => ({ url: "/project/tasks", method: "POST", body }),
      invalidatesTags: ["Task", "Activity"],
    }),

    getAllTasks: builder.query<ApiResponse<PaginatedResponse<Task>>, TaskQuery>({
      query: (params) => ({ url: "/project/tasks", params }),
      providesTags: ["Task"],
    }),

    getTaskById: builder.query<ApiResponse<Task>, string>({
      query: (id) => ({ url: `/project/tasks/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Task", id }],
    }),

    updateTask: builder.mutation<
      ApiResponse<Task>,
      {
        id: string;
        body: Partial<{
          title: string;
          description: string;
          dueDate: string;
          priority: string;
          status: string;
          assigneeId: string;
        }>;
      }
    >({
      query: ({ id, body }) => ({ url: `/project/tasks/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Task", id }, "Task", "Activity"],
    }),

    deleteTask: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/project/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: ["Task", "Activity"],
    }),

    assignTask: builder.mutation<ApiResponse<Task>, { id: string; assigneeId: string }>({
      query: ({ id, assigneeId }) => ({
        url: `/project/tasks/${id}/assign`,
        method: "PATCH",
        body: { assigneeId },
      }),
      invalidatesTags: ["Task", "Notification", "Activity"],
    }),

    getTaskStats: builder.query<ApiResponse<TaskStats>, void>({
      query: () => ({ url: "/project/tasks/stats" }),
      providesTags: ["Task"],
    }),

    // ── Comments ──────────────────────────────────────────────────────
    addComment: builder.mutation<ApiResponse<unknown>, { taskId: string; body: string }>({
      query: ({ taskId, body }) => ({
        url: `/project/tasks/${taskId}/comments`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: (_result, _error, { taskId }) => [{ type: "Task", id: taskId }, "Comment"],
    }),

    deleteComment: builder.mutation<ApiResponse<null>, string>({
      query: (commentId) => ({
        url: `/project/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comment", "Task"],
    }),
  }),
});

export const {
  useCreateTaskMutation,
  useGetAllTasksQuery,
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAssignTaskMutation,
  useGetTaskStatsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
} = taskApi;
