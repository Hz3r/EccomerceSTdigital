import { Router, type Router as RouterType } from "express";
import * as reviewController from "./review.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router: RouterType = Router();

router.get("/product/:productId", reviewController.getByProduct);

router.use(authMiddleware);

router.get("/", roleMiddleware("ADMIN"), reviewController.getAll);
router.get("/:id", reviewController.getById);
router.post("/", reviewController.create);
router.patch("/:id/approve", roleMiddleware("ADMIN"), reviewController.approve);
router.delete("/:id", reviewController.remove);

export default router;
