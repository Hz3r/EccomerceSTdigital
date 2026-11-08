import { Router, type Router as RouterType } from "express";
import * as uploadController from "./upload.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { upload, uploadVideo } from "../../config/upload.js";
import { PERSISTENT_STORAGE } from "../../config/paths.js";

const router: RouterType = Router();

router.use(authMiddleware);

// El admin avisa si las imágenes se borrarán en el próximo despliegue (Railway sin Volume).
router.get("/status", roleMiddleware("ADMIN"), (_req, res) => {
  const nube = Boolean(process.env.RAILWAY_ENVIRONMENT);
  res.status(200).json({ success: true, data: { persistente: PERSISTENT_STORAGE || !nube, nube } });
});

// Videos (va antes de "/:folder": tiene otros formatos y otro límite de tamaño)
router.post(
  "/videos",
  roleMiddleware("ADMIN"),
  (req, _res, next) => {
    req.params.folder = "videos";
    next();
  },
  uploadVideo.single("file"),
  uploadController.uploadFile
);

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
