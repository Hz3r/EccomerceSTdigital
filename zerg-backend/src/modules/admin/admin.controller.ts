import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as adminService from "./admin.service.js";

export const getStats = async (_req: AuthRequest, res: Response) => {
  const stats = await adminService.getStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
};
