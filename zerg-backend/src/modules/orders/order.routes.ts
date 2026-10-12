import { Router, type Router as RouterType } from "express";
import * as orderController from "./order.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router: RouterType = Router();

// Compra como invitado: no requiere cuenta. Si hay sesión, la orden se asocia al usuario.
router.post("/", optionalAuthMiddleware, orderController.create);

router.use(authMiddleware);

router.get("/", roleMiddleware("ADMIN"), orderController.getAll);
router.get("/:id", orderController.getById);
router.patch("/:id/status", roleMiddleware("ADMIN"), orderController.updateStatus);
router.delete("/:id", roleMiddleware("ADMIN"), orderController.remove);

export default router;
