import { Router, type Router as RouterType } from "express";
import * as productController from "./product.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router: RouterType = Router();

router.get("/", productController.getAll);
router.get("/:id", productController.getById);

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

router.post("/", productController.create);
router.put("/:id", productController.update);
router.delete("/:id", productController.remove);

export default router;
