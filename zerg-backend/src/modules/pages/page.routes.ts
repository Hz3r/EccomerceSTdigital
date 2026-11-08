import { Router, type Response, type Router as RouterType } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import type { AuthRequest } from "../../types/index.js";
import * as pageService from "./page.service.js";

const router: RouterType = Router();

// Panel admin: páginas fijas y guías del blog "¿Cómo comprar?"
router.use("/admin", authMiddleware, roleMiddleware("ADMIN"));
router.get("/admin", async (_req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await pageService.adminOverview() });
});
router.get("/admin/:slug", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await pageService.getBySlug(req.params.slug as string, { admin: true }) });
});
router.put("/admin/fixed/:slug", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await pageService.saveFixed(req.params.slug as string, req.body ?? {}) });
});
router.delete("/admin/fixed/:slug", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await pageService.restoreFixed(req.params.slug as string) });
});
router.post("/admin/guides", async (req: AuthRequest, res: Response) => {
  res.status(201).json({ success: true, data: await pageService.createGuide(req.body ?? {}) });
});
router.put("/admin/guides/order", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await pageService.reorderGuides(req.body?.ids) });
});
router.put("/admin/guides/:id", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await pageService.updateGuide(req.params.id as string, req.body ?? {}) });
});
router.delete("/admin/guides/:id", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await pageService.removeGuide(req.params.id as string) });
});

// Tienda: guías publicadas y cada página (el admin con sesión también ve las guías sin publicar, para previsualizar)
router.get("/guias", async (_req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await pageService.listGuides() });
});
router.get("/:slug", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  const data = await pageService.getBySlug(req.params.slug as string, { admin: req.user?.rol === "ADMIN" });
  res.status(200).json({ success: true, data });
});

export default router;
