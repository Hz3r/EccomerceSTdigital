import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import type { RolUsuario } from "@prisma/client";
export declare const roleMiddleware: (...allowedRoles: RolUsuario[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=role.middleware.d.ts.map