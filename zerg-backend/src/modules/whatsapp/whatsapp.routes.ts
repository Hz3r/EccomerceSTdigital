import express, { Router, type Request, type Response, type Router as RouterType } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { isValidSignature, whatsappConfig } from "./whatsapp.client.js";
import * as whatsappService from "./whatsapp.service.js";

const router: RouterType = Router();

// Meta verifica el webhook una vez: devolvemos hub.challenge si el verify token coincide.
router.get("/webhook", (req: Request, res: Response) => {
  const config = whatsappConfig();
  if (config && req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === config.verifyToken) {
    res.status(200).type("text/plain").send(String(req.query["hub.challenge"] ?? ""));
    return;
  }
  res.sendStatus(403);
});

// Mensajes entrantes. El cuerpo llega sin procesar para comprobar la firma de Meta.
router.post("/webhook", express.raw({ type: "*/*", limit: "1mb" }), async (req: Request, res: Response) => {
  const config = whatsappConfig();
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!config || !isValidSignature(raw, req.header("x-hub-signature-256"), config.appSecret)) {
    res.sendStatus(401);
    return;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw.toString("utf8"));
  } catch {
    res.sendStatus(400);
    return;
  }
  // Meta reintenta si no respondemos 200: un error al guardar se registra y se confirma igual.
  await whatsappService.handleWebhook(payload as Parameters<typeof whatsappService.handleWebhook>[0]).catch((err) => {
    console.error("[whatsapp] No se pudo guardar el mensaje entrante:", err);
  });
  res.sendStatus(200);
});

router.get("/status", authMiddleware, roleMiddleware("ADMIN"), (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: whatsappService.status() });
});

export default router;
