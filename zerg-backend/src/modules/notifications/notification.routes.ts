import { Router, type Router as RouterType } from "express";
import * as notificationController from "./notification.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: RouterType = Router();

// Cada usuario (admin o cliente) solo lee y marca sus propias notificaciones.
router.use(authMiddleware);

router.get("/", notificationController.list);
router.post("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);

export default router;
