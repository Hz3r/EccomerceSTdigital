import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as userService from "./user.service.js";

export const getAll = async (_req: AuthRequest, res: Response) => {
  const users = await userService.getAll();

  res.status(200).json({
    success: true,
    data: users,
  });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const user = await userService.getById(id);

  res.status(200).json({
    success: true,
    data: user,
  });
};

export const update = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { nombre, rol, isActive } = req.body;

  const user = await userService.update(id, { nombre, rol, isActive });

  res.status(200).json({
    success: true,
    message: "Usuario actualizado",
    data: user,
  });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  if (req.user?.userId === id) {
    res.status(400).json({
      success: false,
      message: "No puedes eliminar tu propio usuario",
    });
    return;
  }

  const result = await userService.remove(id);

  res.status(200).json({
    success: true,
    ...result,
  });
};
