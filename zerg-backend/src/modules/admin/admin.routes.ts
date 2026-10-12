import { Router, type Router as RouterType } from "express";
import * as adminController from "./admin.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router: RouterType = Router();

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

router.get("/stats", adminController.getStats);

export default router;
