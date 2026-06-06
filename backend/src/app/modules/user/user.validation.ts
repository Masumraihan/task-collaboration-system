import { z } from "zod";
import { Role } from "../../../generated/prisma/enums";

// ─────────────────────────────────────────────
// VALIDATION RECORD SCHEMA
// ─────────────────────────────────────────────

const ValidationSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string({ required_error: "User ID is required." }),
    otp: z.number({ required_error: "OTP is required and must be a number." }),
    isVerified: z.boolean().optional(),
    expiresAt: z.date().optional().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  })
  .strict();

// ─────────────────────────────────────────────
// USER SCHEMA (admin toggle)
// ─────────────────────────────────────────────

const UserSchema = z
  .object({
    isActive: z.boolean().optional(),
    isDelete: z.boolean().optional(),
  })
  .strict();

// ─────────────────────────────────────────────
// CREATE USER (admin creates a user directly)
// ─────────────────────────────────────────────

const createUserValidation = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: "Name is required" })
        .min(3, { message: "Name must be at least 3 characters long" })
        .max(50, { message: "Name must be at most 50 characters long" }),
      email: z
        .string({ required_error: "Email is required" })
        .email({ message: "Invalid email address" })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
      password: z
        .string({ required_error: "Password is required" })
        .min(6, { message: "Password must be at least 6 characters" })
        .transform((val) => val.replace(/^\s+|\s+$/g, "")),
      role: z
        .enum([...Object.keys(Role)] as [string, ...string[]], {
          message: "Role must be 'ADMIN', 'PROJECT_MANAGER' or 'TEAM_MEMBER'",
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
// UPDATE PROFILE (own profile)
// ─────────────────────────────────────────────

const updateProfileValidation = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(3, { message: "Name must be at least 3 characters long" })
        .max(50, { message: "Name must be at most 50 characters long" })
        .optional(),
      avatarUrl: z.string().url({ message: "Invalid URL for avatar." }).optional(),
    })
    .strict(),
});

// ─────────────────────────────────────────────
// UPDATE USER (admin — can change role, active status)
// ─────────────────────────────────────────────

const updateUserValidation = z.object({
  body: z
    .object({
      name: z.string().min(3).max(50).optional(),
      email: z.string().email({ message: "Invalid email address" }).optional(),
      role: z
        .enum([...Object.keys(Role)] as [string, ...string[]], {
          message: "Role must be 'ADMIN', 'PROJECT_MANAGER' or 'TEAM_MEMBER'",
        })
        .optional(),
      avatarUrl: z.string().url({ message: "Invalid URL for avatar." }).optional(),
      isActive: z.boolean().optional(),
    })
    .strict(),
});

// ─────────────────────────────────────────────

export const UserValidations = {
  ValidationSchema,
  UserSchema,
  createUserValidation,
  updateProfileValidation,
  updateUserValidation,
};
