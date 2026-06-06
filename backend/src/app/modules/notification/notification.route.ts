import { Router } from "express";
import auth from "../../middlewares/auth";
import { NotificationControllers } from "./notification.controller";
import validateRequest from "../../middlewares/validateRequest";
import { NotificationValidation } from "./notification.validation";

const router = Router();

router.post(
  "/create",
  auth("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  NotificationControllers.createTest,
);

router.post(
  "/broadcast",
  auth("ADMIN"),
  validateRequest(NotificationValidation.broadcastNotificationValidation),
  NotificationControllers.createBroadcastNotification,
);

router.get(
  "/notifications",
  auth("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  NotificationControllers.getNotification,
);

router.patch(
  "/read",
  auth("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  NotificationControllers.readNotification,
);
router.delete(
  "/",
  auth("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  NotificationControllers.deleteAllNotification,
);
router.delete(
  "/:id",
  auth("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  NotificationControllers.deleteNotification,
);
export const NotificationRoutes = router;
