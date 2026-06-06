import { Router } from "express";
import multer, { memoryStorage } from "multer";
import { uploadToS3 } from "../../constant/s3";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidations } from "./auth.validation";
const storage = memoryStorage();
const upload = multer({ storage });

const router = Router();
router.get("/refresh-token", AuthController.refreshToken);
router.post(
  "/sign-up",
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const fileExtension = req.file.mimetype.split("/")[1] || "png";
        const avatarUrl = await uploadToS3({
          file: req.file,
          fileName: `event/users/${Math.floor(100000 + Math.random() * 900000)}.${fileExtension}`,
        });
        if (req.body?.data) {
          req.body = AuthValidations.signUpValidation.parse({
            ...JSON.parse(req?.body?.data),
            avatarUrl,
          });
        }
      } else {
        if (req.body?.data) {
          req.body = AuthValidations.signUpValidation.parse(JSON.parse(req?.body?.data));
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  AuthController.signUp,
);

router.post("/sign-in", validateRequest(AuthValidations.signInValidation), AuthController.signIn);

router.patch(
  "/change-password",
  auth("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  validateRequest(AuthValidations.changePasswordValidation),
  AuthController.changePassword,
);

router.post(
  "/forget-password",
  validateRequest(AuthValidations.forgetPasswordValidation),
  AuthController.forgetPassword,
);

router.post(
  "/resend-forget-otp",
  validateRequest(AuthValidations.resendOtpValidation), // reuses same schema: { body: { token } }
  AuthController.resendForgetOtp,
);

router.post(
  "/reset-password",
  validateRequest(AuthValidations.resetPasswordValidation),
  AuthController.resetPassword,
);
router.post(
  "/verify-account",
  validateRequest(AuthValidations.optValidation),
  AuthController.verifyAccount,
);

router.post(
  "/resend-otp",
  validateRequest(AuthValidations.resendOtpValidation),
  AuthController.resendOtp,
);
export const AuthRoutes = router;
