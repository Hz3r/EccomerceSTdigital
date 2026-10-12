import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import { verifyToken } from "../utils/token.js";
import { UnauthorizedError } from "../errors/appError.js";

export const authMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token no proporcionado");
  }

  const parts = authHeader.split(" ");
  const token = parts[1];

  if (!token) {
    throw new UnauthorizedError("Token no proporcionado");
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError("Token inválido o expirado");
  }
};
