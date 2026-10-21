import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as notificationService from "./notification.service.js";

export const list = async (req: AuthRequest, res: Response) => {
  const data = await notificationService.list(req.user!, {
    tipo: notificationService.parseTipo(req.query.tipo),
    limit: Number(req.query.limit) || undefined,
  });
  res.status(200).json({ success: true, data });
};

export const markRead = async (req: AuthRequest, res: Response) => {
  const data = await notificationService.markRead(req.user!, req.params.id as string);
  res.status(200).json({ success: true, data });
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  const data = await notificationService.markAllRead(req.user!, notificationService.parseTipo(req.query.tipo));
  res.status(200).json({ success: true, data });
};
