import { baseApi } from "@/lib/baseApi";
import type {
  ApiResponse,
  Project,
  ProjectStats,
  ProjectQuery,
  MemberWorkload,
  ActivityLog,
  PaginationQuery,
} from "@/types";

interface PaginatedResponse<T> {
  meta: { page: number; limit: number; total: number; totalPage: number };
  data: T[];
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Projects ──────────────────────────────────────────────────────
    createProject: builder.mutation<
      ApiResponse<Project>,
      {
        name: string;
        description?: string;
        deadline: string;
        status?: string;
      }
    >({
      query: (body) => ({ url: "/project", method: "POST", body }),
      invalidatesTags: ["Project"],
    }),

    getAllProjects: builder.query<ApiResponse<PaginatedResponse<Project>>, ProjectQuery>({
      query: (params) => ({ url: "/project", params }),
      providesTags: ["Project"],
    }),

    getProjectById: builder.query<ApiResponse<Project>, string>({
      query: (id) => ({ url: `/project/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),

    updateProject: builder.mutation<
      ApiResponse<Project>,
      {
        id: string;
        body: Partial<{ name: string; description: string; deadline: string; status: string }>;
      }
    >({
      query: ({ id, body }) => ({ url: `/project/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Project", id }, "Project"],
    }),

    deleteProject: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/project/${id}`, method: "DELETE" }),
      invalidatesTags: ["Project"],
    }),

    getProjectStats: builder.query<ApiResponse<ProjectStats>, void>({
      query: () => ({ url: "/project/stats" }),
      providesTags: ["Project"],
    }),

    // ── Team Members ───────────────────────────────────────────────────
    addTeamMember: builder.mutation<ApiResponse<unknown>, { userId: string; projectId: string }>({
      query: (body) => ({ url: "/project/members/add", method: "POST", body }),
      invalidatesTags: ["Project", "User"],
    }),

    removeTeamMember: builder.mutation<ApiResponse<unknown>, { projectId: string; userId: string }>(
      {
        query: ({ projectId, userId }) => ({
          url: `/project/${projectId}/members/${userId}`,
          method: "DELETE",
        }),
        invalidatesTags: ["Project", "User"],
      },
    ),

    getProjectMembers: builder.query<
      ApiResponse<PaginatedResponse<MemberWorkload>>,
      {
        projectId: string;
        params?: PaginationQuery & { searchTerm?: string };
      }
    >({
      query: ({ projectId, params }) => ({ url: `/project/${projectId}/members`, params }),
      providesTags: ["User"],
    }),

    getTeamMemberTasks: builder.query<
      ApiResponse<PaginatedResponse<unknown>>,
      {
        memberId: string;
        params?: PaginationQuery;
      }
    >({
      query: ({ memberId, params }) => ({
        url: `/project/members/${memberId}/tasks`,
        params,
      }),
      providesTags: ["Task"],
    }),

    // ── Activity Logs ─────────────────────────────────────────────────
    getActivityLogs: builder.query<
      ApiResponse<PaginatedResponse<ActivityLog>>,
      PaginationQuery & {
        projectId?: string;
        action?: string;
      }
    >({
      query: (params) => ({ url: "/project/activities", params }),
      providesTags: ["Activity"],
    }),

    getRecentActivities: builder.query<ApiResponse<ActivityLog[]>, void>({
      query: () => ({ url: "/project/activities/recent" }),
      providesTags: ["Activity"],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useGetAllProjectsQuery,
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectStatsQuery,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useGetProjectMembersQuery,
  useGetTeamMemberTasksQuery,
  useGetActivityLogsQuery,
  useGetRecentActivitiesQuery,
} = projectApi;
