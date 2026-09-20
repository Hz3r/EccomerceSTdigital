import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as categoryService from "./category.service.js";

export const getAll = async (_req: AuthRequest, res: Response) => {
  const categories = await categoryService.getAll();

  res.status(200).json({
    success: true,
    data: categories,
  });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const category = await categoryService.getById(id);

  res.status(200).json({
    success: true,
    data: category,
  });
};

export const create = async (req: AuthRequest, res: Response) => {
  const { nombre, slug, descripcion, imagenUrl } = req.body;

  const category = await categoryService.create({
    nombre,
    slug,
    descripcion,
    imagenUrl,
  });

  res.status(201).json({
    success: true,
    message: "Categoría creada exitosamente",
    data: category,
  });
};

export const update = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { nombre, slug, descripcion, imagenUrl, isActive } = req.body;

  const category = await categoryService.update(id, {
    nombre,
    slug,
    descripcion,
    imagenUrl,
    isActive,
  });

  res.status(200).json({
    success: true,
    message: "Categoría actualizada",
    data: category,
  });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const result = await categoryService.remove(id);

  res.status(200).json({
    success: true,
    ...result,
  });
};
