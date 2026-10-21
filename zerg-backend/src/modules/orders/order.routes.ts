import { Router, type Router as RouterType } from "express";
import * as orderController from "./order.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router: RouterType = Router();

// Todas las rutas requieren sesión: para comprar el cliente debe ingresar (la orden queda en su cuenta).
router.use(authMiddleware);

router.post("/", orderController.create);
router.get("/", roleMiddleware("ADMIN"), orderController.getAll);
router.get("/:id", orderController.getById);
router.patch("/:id/status", roleMiddleware("ADMIN"), orderController.updateStatus);
router.delete("/:id", roleMiddleware("ADMIN"), orderController.remove);

export default router;
