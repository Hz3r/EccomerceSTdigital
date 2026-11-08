import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as productService from "./product.service.js";
import { parseProductContent } from "./product.content.js";

export const getAll = async (_req: AuthRequest, res: Response) => {
  const products = await productService.getAll();

  res.status(200).json({
    success: true,
    data: products,
  });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const product = await productService.getById(id);

  res.status(200).json({
    success: true,
    data: product,
  });
};

// Texto opcional: "" o null lo borra; si no viene, no se toca.
const optionalText = (value: unknown, max: number) =>
  value === null ? null : typeof value === "string" ? value.trim().slice(0, max) || null : undefined;

export const create = async (req: AuthRequest, res: Response) => {
  const { nombre, slug, descripcion, imagenUrl, categoryId } = req.body;

  const product = await productService.create({
    nombre,
    slug,
    descripcion,
    imagenUrl,
    imagenTarjeta: optionalText(req.body?.imagenTarjeta, 500),
    notaCantidad: optionalText(req.body?.notaCantidad, 160),
    categoryId,
    ...parseProductContent(req.body ?? {}),
  });

  res.status(201).json({
    success: true,
    message: "Producto creado exitosamente",
    data: product,
  });
};

export const update = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { nombre, slug, descripcion, imagenUrl, categoryId, isActivo } =
    req.body;

  const product = await productService.update(id, {
    nombre,
    slug,
    descripcion,
    imagenUrl,
    imagenTarjeta: optionalText(req.body?.imagenTarjeta, 500),
    notaCantidad: optionalText(req.body?.notaCantidad, 160),
    categoryId,
    isActivo,
    ...parseProductContent(req.body ?? {}),
  });

  res.status(200).json({
    success: true,
    message: "Producto actualizado",
    data: product,
  });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const result = await productService.remove(id);

  res.status(200).json({
    success: true,
    ...result,
  });
};
