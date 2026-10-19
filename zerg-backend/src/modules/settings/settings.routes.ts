import { Router, type Router as RouterType } from "express";
import * as settingsController from "./settings.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router: RouterType = Router();

// La tienda lee el contenido sin sesión; solo un ADMIN puede cambiarlo.
router.get("/", settingsController.get);

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

router.put("/", settingsController.update);
router.delete("/", settingsController.reset);

export default router;
