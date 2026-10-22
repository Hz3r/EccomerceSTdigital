import { Router, type Router as RouterType } from "express";
import rateLimit from "express-rate-limit";
import * as supportController from "./support.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";

const router: RouterType = Router();

const limited = (max: number, windowMs: number, message: string) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { success: false, message } });

// Chat de la tienda: abierto a visitantes (con token propio) y a clientes con sesión.
router.get("/temas", supportController.temas);
router.post("/conversations", limited(5, 15 * 60 * 1000, "Ya iniciaste varios chats. Espera unos minutos."), optionalAuthMiddleware, supportController.start);
router.get("/conversation", optionalAuthMiddleware, supportController.current);
router.post("/conversation/messages", limited(30, 60 * 1000, "Estás enviando mensajes muy rápido."), optionalAuthMiddleware, supportController.send);

// Bandeja del admin
router.use("/admin", authMiddleware, roleMiddleware("ADMIN"));
router.get("/admin/conversations", supportController.list);
router.get("/admin/conversations/:id", supportController.getForAdmin);
router.post("/admin/conversations/:id/messages", supportController.reply);
router.patch("/admin/conversations/:id", supportController.setEstado);

export default router;
