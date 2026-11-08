import { Router, type Router as RouterType, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import * as newsletterService from "./newsletter.service.js";
import * as campaignService from "./newsletter.campaign.js";

const router: RouterType = Router();

// Formulario público de la tienda: pocas altas por IP para frenar el spam.
const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Ya enviaste varias suscripciones. Intenta en unos minutos." },
});

router.post("/subscribe", subscribeLimiter, async (req: Request, res: Response) => {
  const result = await newsletterService.subscribe(req.body ?? {});
  res.status(200).json({ success: true, ...result });
});

// Enlace "Darse de baja" de los correos (página /boletin/baja de la tienda). Va firmado.
const unsubscribeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
router.post("/unsubscribe", unsubscribeLimiter, async (req: Request, res: Response) => {
  const result = await campaignService.unsubscribe(req.body?.id, req.body?.t);
  res.status(200).json({ success: true, data: result });
});

// Panel admin
router.use(authMiddleware, roleMiddleware("ADMIN"));

// Envío del boletín
router.get("/campaigns", async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: await campaignService.listCampaigns() });
});
router.post("/campaigns/preview", async (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { html: await campaignService.preview(req.body ?? {}) } });
});
router.post("/campaigns/test", async (req: Request, res: Response) => {
  res.status(200).json({ success: true, ...(await campaignService.sendTest(req.body ?? {})) });
});
router.post("/campaigns", async (req: Request, res: Response) => {
  res.status(201).json({ success: true, data: await campaignService.startCampaign(req.body ?? {}) });
});

router.get("/", async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: await newsletterService.list() });
});

router.get("/export", async (req: Request, res: Response) => {
  const csv = await newsletterService.exportCsv(req.query.todos !== "1");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="suscriptores.csv"');
  res.status(200).send(csv);
});

router.patch("/:id", async (req: Request, res: Response) => {
  const data = await newsletterService.setActivo(req.params.id as string, req.body?.activo);
  res.status(200).json({ success: true, data });
});

router.delete("/:id", async (req: Request, res: Response) => {
  res.status(200).json({ success: true, ...(await newsletterService.remove(req.params.id as string)) });
});

export default router;
