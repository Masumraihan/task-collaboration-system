import express from "express";
import multer, { memoryStorage } from "multer";
import { uploadManyToS3, uploadToS3 } from "../../constant/s3";
import auth from "../../middlewares/auth";
import { UserControllers } from "./user.controller";
import { UserValidations } from "./user.validation";
const storage = memoryStorage();
const upload = multer({ storage });
const router = express.Router();

router.get("/users", auth("ADMIN"), UserControllers.getUsers);
router.get(
  "/profile",
  auth("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  UserControllers.getMyProfile,
);

router.get("/:id", auth("ADMIN"), UserControllers.getUser);

router.post(
  "/create",
  auth("ADMIN"),
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  async (req, res, next) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const data = typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;

      const result: any = { ...data };

      // PROFILE PICTURE
      const profilePictureFile = files?.profilePicture?.[0];
      if (profilePictureFile) {
        const profilePicturePath = `app_endek/profile/${new Date().getTime()}.${profilePictureFile.originalname
          .split(".")
          .pop()}`;
        const url = await uploadToS3({ file: profilePictureFile, fileName: profilePicturePath });

        result.profilePicture = url;
        result.profilePicturePath = profilePicturePath;
      }

      // VALIDATE FINAL BODY
      req.body = await UserValidations.createUserValidation.parseAsync(result);

      next();
    } catch (error) {
      next(error);
    }
  },
  UserControllers.createUser,
);

router.patch(
  "/profile",
  auth("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPicture", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const data = typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;

      const result: any = { ...data };

      // PROFILE PICTURE
      const profilePictureFile = files?.profilePicture?.[0];
      const coverPictureFile = files?.coverPicture?.[0];
      if (profilePictureFile) {
        const profilePicturePath = `app_endek/profile/${new Date().getTime()}${Math.round(
          Math.random() * 1e9,
        )}.${profilePictureFile.originalname.split(".").pop()}`;
        const url = await uploadToS3({ file: profilePictureFile, fileName: profilePicturePath });
        result.profilePicture = url;
        result.profilePicturePath = profilePicturePath;
      }

      if (coverPictureFile) {
        const coverPicturePath = `app_endek/cover/${new Date().getTime()}${Math.round(
          Math.random() * 1e9,
        )}.${coverPictureFile.originalname.split(".").pop()}`;
        const url = await uploadToS3({ file: coverPictureFile, fileName: coverPicturePath });
        result.coverPicture = url;
        result.coverPicturePath = coverPicturePath;
      }

      // VALIDATE FINAL BODY
      req.body = await UserValidations.updateProfileValidation.parseAsync(result);

      next();
    } catch (error) {
      next(error);
    }
  },
  UserControllers.updateMyProfile,
);

router.patch(
  "/:id",
  auth("ADMIN"),
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  async (req, res, next) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const data = typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
      const result: any = { ...data };

      // PROFILE PICTURE
      const profilePictureFile = files?.profilePicture?.[0];
      if (profilePictureFile) {
        const profilePicturePath = `app_endek/profile/${Math.floor(
          100000 + Math.random() * 900000,
        )}.${profilePictureFile.originalname.split(".").pop()}`;
        const url = await uploadToS3({ file: profilePictureFile, fileName: profilePicturePath });
        result.profilePicture = url;
        result.profilePicturePath = profilePicturePath;
      }

      // SIGNATURE
      const signatureFile = files?.signature?.[0];
      if (signatureFile) {
        const signaturePath = `app_endek/signature/${Math.floor(
          100000 + Math.random() * 900000,
        )}.${signatureFile.originalname.split(".").pop()}`;

        const url = await uploadToS3({ file: signatureFile, fileName: signaturePath });
        result.signature = url;
        result.signaturePath = signaturePath;
      }

      // NURSE DOCUMENTS
      const nurseDocs = files?.nurseDocuments || [];
      if (nurseDocs.length) {
        const uploadPayload = nurseDocs.map((file) => {
          const fileName = `app_endek/nurse-documents/${Math.floor(
            100000 + Math.random() * 900000,
          )}.${file.originalname.split(".").pop()}`;

          return { file, path: fileName };
        });

        const uploadedDocs = await uploadManyToS3(uploadPayload);
        result.nurseDocuments = uploadedDocs.map((doc) => ({
          url: doc.url,
          path: doc.key,
        }));
      }

      // VALIDATE FINAL BODY
      req.body = await UserValidations.updateProfileValidation.parseAsync(result);

      next();
    } catch (error) {
      next(error);
    }
  },
  UserControllers.updateUser,
);

router.patch("/:id/verify", auth("ADMIN"), UserControllers.markAsVerified);

router.delete(
  "/my-profile",
  auth("PROJECT_MANAGER", "TEAM_MEMBER"),
  UserControllers.deleteMyProfile,
);
router.delete("/:id", auth("ADMIN"), UserControllers.deleteUser);
export const UserRoutes = router;
