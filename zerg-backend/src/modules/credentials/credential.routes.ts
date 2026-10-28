import { Router, type Response, type Router as RouterType } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import type { AuthRequest } from "../../types/index.js";
import * as credentialService from "./credential.service.js";

const router: RouterType = Router();

router.use(authMiddleware);

// Cliente: sus accesos ("Mis accesos" en la tienda)
router.get("/mine", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await credentialService.mine(req.user!.userId) });
});
router.post("/mine/:id/seen", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await credentialService.markSeen(req.user!.userId, req.params.id as string) });
});

// Admin: cargar y enviar los accesos de un pedido
router.use("/admin", roleMiddleware("ADMIN"));
router.get("/admin/orders/:orderId", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await credentialService.getForOrder(req.params.orderId as string) });
});
router.post("/admin/orders/:orderId/send", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await credentialService.send(req.params.orderId as string, req.body?.canales) });
});
router.put("/admin/items/:itemId", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await credentialService.save(req.params.itemId as string, req.body ?? {}) });
});
router.delete("/admin/items/:itemId", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await credentialService.remove(req.params.itemId as string) });
});

export default router;
