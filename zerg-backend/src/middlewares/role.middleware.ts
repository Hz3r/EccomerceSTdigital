import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import type { RolUsuario } from "@prisma/client";
import { ForbiddenError } from "../errors/appError.js";

export const roleMiddleware = (...allowedRoles: RolUsuario[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenError("No autenticado");
    }

    if (!allowedRoles.includes(req.user.rol)) {
      throw new ForbiddenError("No tienes permisos para realizar esta acción");
    }

    next();
  };
};
