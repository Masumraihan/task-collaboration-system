import { baseApi } from "@/lib/baseApi";
import type { ApiResponse, AuthUser, User } from "@/types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signUp: builder.mutation<
      ApiResponse<{ token: string }>,
      {
        name: string;
        email: string;
        password: string;
        role?: string;
      }
    >({
      query: (body) => ({ url: "/auth/sign-up", method: "POST", body }),
    }),

    signIn: builder.mutation<
      ApiResponse<AuthUser>,
      {
        email: string;
        password: string;
      }
    >({
      query: (body) => ({ url: "/auth/sign-in", method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),

    verifyAccount: builder.mutation<ApiResponse<AuthUser>, { otp: number, token?: string }>({
      query: (body) => ({ url: "/auth/verify-account", method: "POST", body }),
    }),

    resendOtp: builder.mutation<ApiResponse<{ token: string }>, { token?: string }>({
      query: (body) => ({ url: "/auth/resend-otp", method: "POST", body }),
    }),

    forgetPassword: builder.mutation<ApiResponse<{ token: string }>, { email: string }>({
      query: (body) => ({ url: "/auth/forget-password", method: "POST", body }),
    }),

    resendForgetOtp: builder.mutation<ApiResponse<{ token: string }>, { token: string }>({
      query: (body) => ({ url: "/auth/resend-forget-otp", method: "POST", body }),
    }),

    resetPassword: builder.mutation<ApiResponse<AuthUser>, { otp: number; password: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),

    changePassword: builder.mutation<
      ApiResponse<null>,
      {
        oldPassword: string;
        newPassword: string;
      }
    >({
      query: (body) => ({ url: "/auth/change-password", method: "PATCH", body }),
    }),

    refreshToken: builder.query<ApiResponse<{ accessToken: string }>, void>({
      query: () => ({ url: "/auth/refresh-token", method: "GET" }),
    }),
  }),
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useVerifyAccountMutation,
  useResendOtpMutation,
  useForgetPasswordMutation,
  useResendForgetOtpMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useRefreshTokenQuery,
} = authApi;
