import jwt from "jsonwebtoken";
import type { RolUsuario } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "zerg-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  rol: RolUsuario;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
