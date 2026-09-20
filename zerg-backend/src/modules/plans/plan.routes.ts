import { Router, type Router as RouterType } from "express";
import * as planController from "./plan.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router: RouterType = Router();

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

router.get("/", planController.getAll);
router.get("/:id", planController.getById);
router.post("/", planController.create);
router.put("/:id", planController.update);
router.delete("/:id", planController.remove);

export default router;
