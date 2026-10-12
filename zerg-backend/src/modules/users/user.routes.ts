import { Router, type Router as RouterType } from "express";
import * as userController from "./user.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router: RouterType = Router();

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

export default router;
