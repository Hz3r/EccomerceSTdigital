import { Router, type Router as RouterType, type Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import * as favoriteService from "./favorite.service.js";

const router: RouterType = Router();

// Favoritos de la cuenta: se guardan en el servidor y se ven en cualquier dispositivo.
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await favoriteService.list(req.user!.userId) });
});
router.get("/ids", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await favoriteService.ids(req.user!.userId) });
});
router.post("/:productId", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await favoriteService.add(req.user!.userId, req.params.productId as string) });
});
router.delete("/:productId", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await favoriteService.remove(req.user!.userId, req.params.productId as string) });
});

export default router;
