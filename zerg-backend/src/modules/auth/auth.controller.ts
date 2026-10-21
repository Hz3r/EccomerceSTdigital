import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as authService from "./auth.service.js";
import { getGoogleClientId } from "../../utils/google.js";
import { BadRequestError } from "../../errors/appError.js";
import {
  validateRegister,
  validateLogin,
} from "../../validations/auth.schema.js";

export const register = async (req: AuthRequest, res: Response) => {
  const dto = validateRegister(req.body);
  const result = await authService.register(dto);

  res.status(201).json({
    success: true,
    message: "Usuario registrado exitosamente",
    data: result,
  });
};

export const login = async (req: AuthRequest, res: Response) => {
  const dto = validateLogin(req.body);
  const result = await authService.login(dto);

  res.status(200).json({
    success: true,
    message: "Inicio de sesión exitoso",
    data: result,
  });
};

export const google = async (req: AuthRequest, res: Response) => {
  const credential = (req.body as { credential?: unknown } | undefined)?.credential;
  if (typeof credential !== "string" || !credential) {
    throw new BadRequestError("Falta el token de Google");
  }
  const result = await authService.google(credential);

  res.status(200).json({
    success: true,
    message: "Inicio de sesión exitoso",
    data: result,
  });
};

// La tienda pregunta si Google está configurado (y con qué Client ID) para mostrar el botón.
export const googleConfig = (_req: AuthRequest, res: Response) => {
  const clientId = getGoogleClientId();
  res.status(200).json({ success: true, data: { enabled: Boolean(clientId), clientId } });
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, message: "No autenticado" });
    return;
  }

  const user = await authService.getProfile(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
};
