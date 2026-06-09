import { baseApi } from "@/lib/baseApi";
import type { ApiResponse, Notification, PaginationQuery } from "@/types";

interface PaginatedResponse<T> {
  meta: { page: number; limit: number; total: number; totalPage: number };
  data: T[];
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      ApiResponse<PaginatedResponse<Notification>>,
      PaginationQuery & {
        isRead?: boolean;
      }
    >({
      query: (params) => ({ url: "/notification/notifications", params }),
      providesTags: ["Notification"],
    }),

    markAsRead: builder.mutation<ApiResponse<unknown>, { id?: string }>({
      query: (body) => ({ url: "/notification/read", method: "PATCH", body }),
      invalidatesTags: ["Notification"],
    }),

    deleteNotification: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/notification/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notification"],
    }),

    deleteAllNotifications: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/notification", method: "DELETE" }),
      invalidatesTags: ["Notification"],
    }),

    broadcastNotification: builder.mutation<
      ApiResponse<null>,
      {
        targetedAudience: string;
        type: string;
        message: string;
        projectId?: string;
        taskId?: string;
      }
    >({
      query: (body) => ({ url: "/notification/broadcast", method: "POST", body }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useBroadcastNotificationMutation,
} = notificationApi;
