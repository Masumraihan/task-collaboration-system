import { z } from "zod";
import { Role } from "../../../generated/prisma/enums";

// ─────────────────────────────────────────────
// SIGN UP
// ─────────────────────────────────────────────

const signUpValidation = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: "Name is required" })
        .min(3, { message: "Name must be at least 3 characters long" })
        .max(50, { message: "Name must be at most 50 characters long" }),
      email: z
        .string({ required_error: "Email is required" })
        .email({ message: "Invalid email format. Please provide a valid email address." })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
      password: z
        .string({ required_error: "Password is required" })
        .min(6, { message: "Password must be at least 6 characters long" })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
      role: z
        .enum([...Object.keys(Role)] as [string, ...string[]], {
          message: "Role must be either 'ADMIN', 'PROJECT_MANAGER' or 'TEAM_MEMBER'",
        })
        .optional(),
      avatarUrl: z
        .string()
        .url({ message: "Invalid URL for avatar. Please provide a valid URL." })
        .optional(),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// SIGN IN
// ─────────────────────────────────────────────

const signInValidation = z.object({
  body: z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email({ message: "Invalid email format." })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
      password: z
        .string({ required_error: "Password is required" })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────

const refreshTokenValidation = z.object({
  cookies: z
    .object({
      refreshToken: z.string({ required_error: "Refresh token is required!" }).optional(),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────

const changePasswordValidation = z.object({
  body: z
    .object({
      oldPassword: z
        .string({ required_error: "Old password is required" })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
      newPassword: z
        .string({ required_error: "New password is required" })
        .min(6, { message: "New password must be at least 6 characters long" })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// FORGET PASSWORD
// ─────────────────────────────────────────────

const forgetPasswordValidation = z.object({
  body: z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email({ message: "Invalid email format." })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// OTP (verify account)
// ─────────────────────────────────────────────

const optValidation = z.object({
  body: z
    .object({
      otp: z.number({ required_error: "OTP is required" }),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────

const resendOtpValidation = z.object({
  body: z
    .object({
      token: z.string({ required_error: "Token is required" }).optional(),
    })
    .strict()
    .optional(),
});

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────

const resetPasswordValidation = z.object({
  body: z
    .object({
      otp: z.number({ required_error: "OTP is required" }),
      password: z
        .string({ required_error: "Password is required" })
        .min(6, { message: "Password must be at least 6 characters long" })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
    })
    .strict(),
});

// ─────────────────────────────────────────────

export const AuthValidations = {
  signUpValidation,
  signInValidation,
  refreshTokenValidation,
  forgetPasswordValidation,
  optValidation,
  resendOtpValidation,
  changePasswordValidation,
  resetPasswordValidation,
};
