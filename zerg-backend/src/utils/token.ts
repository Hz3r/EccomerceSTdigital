import jwt from "jsonwebtoken";
import type { RolUsuario } from "@prisma/client";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está definido en las variables de entorno");
  }
  return secret;
}

const JWT_EXPIRES_IN = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  rol: RolUsuario;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
};
