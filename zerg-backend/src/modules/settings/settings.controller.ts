import type { Request, Response } from "express";
import * as settingsService from "./settings.service.js";

export const get = async (_req: Request, res: Response) => {
  const { settings, setupRequired } = await settingsService.getWithStatus();
  res.status(200).json({
    success: true,
    data: settings,
    ...(setupRequired && { setupRequired: true, message: settingsService.SETUP_MESSAGE }),
  });
};

export const update = async (req: Request, res: Response) => {
  const settings = await settingsService.update(req.body);
  res.status(200).json({ success: true, message: "Contenido actualizado", data: settings });
};

export const reset = async (_req: Request, res: Response) => {
  const settings = await settingsService.reset();
  res.status(200).json({ success: true, message: "Contenido restablecido", data: settings });
};
