import { z } from "zod";
import { NotificationType } from "../../../generated/prisma/enums";

const createPushNotificationValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }),
    titleAr: z.string().optional(),
    body: z.string({ required_error: "Body is required" }),
    bodyAr: z.string().optional(),
    targetedAudience: z.enum([
      "all",
      "users",
      "vendors",
      "activeUsers",
      "activeVendors",
      "inactiveUsers",
      "inactiveVendors",
      "activeUsersAndVendors",
      "inactiveUsersAndVendors",
    ]),
  }),
});

export type TCreatePushNotificationValidationSchema = z.infer<
  typeof createPushNotificationValidationSchema
>["body"];

const broadcastNotificationValidation = z.object({
  body: z
    .object({
      targetedAudience: z.enum(["all", "admins", "projectManagers", "teamMembers"], {
        required_error: "Targeted audience is required",
        message: "Must be all, admins, projectManagers or teamMembers",
      }),
      type: z.enum([...Object.keys(NotificationType)] as [string, ...string[]], {
        required_error: "Notification type is required",
      }),
      message: z.string({ required_error: "Message is required" }).min(1),
      projectId: z.string().optional(),
      taskId: z.string().optional(),
    })
    .strict(),
});

export const NotificationValidation = {
  createPushNotificationValidationSchema,
  broadcastNotificationValidation,
};
