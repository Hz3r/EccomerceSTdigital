import { Router, type Router as RouterType } from "express";
import * as uploadController from "./upload.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { upload } from "../../config/upload.js";

const router: RouterType = Router();

router.use(authMiddleware);

router.post(
  "/:folder",
  roleMiddleware("ADMIN"),
  upload.single("file"),
  uploadController.uploadFile
);

router.delete(
  "/:folder/:filename",
  roleMiddleware("ADMIN"),
  uploadController.deleteFile
);

router.get(
  "/:folder/:filename",
  roleMiddleware("ADMIN"),
  uploadController.getFileInfo
);

export default router;
