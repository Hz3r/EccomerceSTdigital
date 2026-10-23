import type { Request, Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import { BadRequestError } from "../../errors/appError.js";
import * as paymentService from "./payment.service.js";

const rawBody = (req: Request) => (Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "");

export const methods = async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: await paymentService.availableMethods() });
};

export const getOrderPayment = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await paymentService.getOrderPayment(req.user!, req.params.numero as string) });
};

export const changeMethod = async (req: AuthRequest, res: Response) => {
  const metodo = paymentService.parseMetodo((req.body as { metodo?: unknown } | undefined)?.metodo);
  if (!metodo) throw new BadRequestError("Método de pago no válido");
  res.status(200).json({ success: true, data: await paymentService.changeMethod(req.user!, req.params.numero as string, metodo) });
};

export const submitProof = async (req: AuthRequest, res: Response) => {
  const data = await paymentService.submitProof(req.user!, req.params.id as string, {
    referencia: (req.body as { referencia?: unknown } | undefined)?.referencia,
    medio: (req.body as { medio?: unknown } | undefined)?.medio,
    file: req.file,
  });
  res.status(200).json({ success: true, message: "Comprobante enviado", data });
};

export const getProof = async (req: AuthRequest, res: Response) => {
  const file = await paymentService.getProof(req.user!, req.params.id as string);
  res.setHeader("Cache-Control", "private, no-store");
  res.sendFile(file);
};

export const review = async (req: AuthRequest, res: Response) => {
  const data = await paymentService.review(req.params.id as string, (req.body ?? {}) as { aprobar: unknown; motivo?: unknown });
  res.status(200).json({ success: true, data });
};

export const startIzipay = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await paymentService.startIzipay(req.user!, req.params.id as string) });
};

export const confirmIzipay = async (req: AuthRequest, res: Response) => {
  const data = await paymentService.confirmIzipayReturn(req.user!, req.params.id as string, (req.body ?? {}) as { krAnswer?: unknown; krHash?: unknown });
  res.status(200).json({ success: true, data });
};

export const startBinance = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await paymentService.startBinance(req.user!, req.params.id as string) });
};

// Webhooks: el cuerpo llega sin procesar (Buffer) para poder verificar la firma byte a byte.
export const izipayIpn = async (req: Request, res: Response) => {
  await paymentService.handleIzipayIpn(rawBody(req));
  res.status(200).send("OK");
};

export const binanceWebhook = async (req: Request, res: Response) => {
  const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v[0] : v]));
  res.status(200).json(await paymentService.handleBinanceWebhook(headers, rawBody(req)));
};
