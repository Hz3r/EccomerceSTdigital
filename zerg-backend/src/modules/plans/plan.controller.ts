import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as planService from "./plan.service.js";

export const getAll = async (_req: AuthRequest, res: Response) => {
  const plans = await planService.getAll();

  res.status(200).json({
    success: true,
    data: plans,
  });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const plan = await planService.getById(id);

  res.status(200).json({
    success: true,
    data: plan,
  });
};

export const create = async (req: AuthRequest, res: Response) => {
  const { nombre, slug, duracion, precio, precioOriginal, descripcion, productId } =
    req.body;

  const plan = await planService.create({
    nombre,
    slug,
    duracion,
    precio,
    precioOriginal,
    descripcion,
    productId,
  });

  res.status(201).json({
    success: true,
    message: "Plan creado exitosamente",
    data: plan,
  });
};

export const update = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { nombre, slug, duracion, precio, precioOriginal, descripcion, isActivo } =
    req.body;

  const plan = await planService.update(id, {
    nombre,
    slug,
    duracion,
    precio,
    precioOriginal,
    descripcion,
    isActivo,
  });

  res.status(200).json({
    success: true,
    message: "Plan actualizado",
    data: plan,
  });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const result = await planService.remove(id);

  res.status(200).json({
    success: true,
    ...result,
  });
};
