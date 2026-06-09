import { baseApi } from "@/lib/baseApi";
import type { ApiResponse, User, MemberWorkload, PaginationQuery } from "@/types";

interface PaginatedResponse<T> {
  meta: { page: number; limit: number; total: number; totalPage: number };
  data: T[];
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<ApiResponse<User>, void>({
      query: () => ({ url: "/user/profile" }),
      providesTags: ["User"],
    }),

    updateMyProfile: builder.mutation<
      ApiResponse<User>,
      Partial<{ name: string; avatarUrl: string }>
    >({
      query: (body) => ({ url: "/user/profile", method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),

    deleteMyProfile: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/user/my-profile", method: "DELETE" }),
    }),

    getAllUsers: builder.query<
      ApiResponse<PaginatedResponse<User>>,
      PaginationQuery & {
        searchTerm?: string;
        isVerified?: boolean;
      }
    >({
      query: (params) => ({ url: "/user/users", params }),
      providesTags: ["User"],
    }),

    getUserById: builder.query<ApiResponse<User>, string>({
      query: (id) => ({ url: `/user/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),

    createUser: builder.mutation<
      ApiResponse<User>,
      {
        name: string;
        email: string;
        password: string;
        role?: string;
        avatarUrl?: string;
      }
    >({
      query: (body) => ({ url: "/user/create", method: "POST", body }),
      invalidatesTags: ["User"],
    }),

    updateUser: builder.mutation<
      ApiResponse<User>,
      {
        id: string;
        body: Partial<{ name: string; email: string; role: string; isActive: boolean }>;
      }
    >({
      query: ({ id, body }) => ({ url: `/user/${id}`, method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),

    markAsVerified: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/user/${id}/verify`, method: "PATCH" }),
      invalidatesTags: ["User"],
    }),

    deleteUser: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/user/${id}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),

    getMemberWorkload: builder.query<ApiResponse<MemberWorkload[]>, string | undefined>({
      query: (projectId) => ({
        url: "/user/workload",
        params: projectId ? { projectId } : {},
      }),
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useDeleteMyProfileMutation,
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useMarkAsVerifiedMutation,
  useDeleteUserMutation,
  useGetMemberWorkloadQuery,
} = userApi;
