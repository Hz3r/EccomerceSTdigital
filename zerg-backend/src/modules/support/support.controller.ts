import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as supportService from "./support.service.js";

const chatToken = (req: AuthRequest) => {
  const value = req.headers["x-chat-token"];
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
};

export const temas = (_req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: supportService.TEMAS });
};

export const start = async (req: AuthRequest, res: Response) => {
  const data = await supportService.start(req.user, (req.body ?? {}) as Record<string, unknown>);
  res.status(201).json({ success: true, data });
};

export const current = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await supportService.current(req.user, chatToken(req), { peek: req.query.peek === "1" }) });
};

export const send = async (req: AuthRequest, res: Response) => {
  const data = await supportService.send(req.user, chatToken(req), (req.body ?? {}) as Record<string, unknown>);
  res.status(201).json({ success: true, data });
};

export const list = async (req: AuthRequest, res: Response) => {
  const [conversations, unread] = await Promise.all([supportService.list(req.query), supportService.unreadCount()]);
  res.status(200).json({ success: true, data: { conversations, unread } });
};

export const getForAdmin = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await supportService.getForAdmin(req.params.id as string) });
};

export const reply = async (req: AuthRequest, res: Response) => {
  const data = await supportService.reply(req.params.id as string, (req.body ?? {}) as Record<string, unknown>);
  res.status(201).json({ success: true, data });
};

export const setEstado = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: await supportService.setEstado(req.params.id as string, (req.body as { estado?: unknown })?.estado) });
};
