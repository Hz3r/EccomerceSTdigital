import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as productService from "./product.service.js";
import { parseProductContent } from "./product.content.js";
import { BadRequestError } from "../../errors/appError.js";

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

// true/false cambia la disponibilidad; si no viene, no se toca.
const optionalBool = (value: unknown) => (typeof value === "boolean" ? value : undefined);

// Stock: número entero >= 0; "" o null lo quita (no se muestra número); si no viene, no se toca.
const optionalStock = (value: unknown) => {
  if (value === null || value === "") return null;
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw new BadRequestError("El stock debe ser un número entero de 0 en adelante");
  return n;
};

const availabilityFields = (body: Record<string, unknown>) => ({
  disponible: optionalBool(body.disponible),
  stock: optionalStock(body.stock),
  mensajeAgotado: optionalText(body.mensajeAgotado, 80),
});

export const create = async (req: AuthRequest, res: Response) => {
  const { nombre, slug, descripcion, imagenUrl, categoryId } = req.body;

  const product = await productService.create({
    nombre,
    slug,
    descripcion,
    imagenUrl,
    imagenTarjeta: optionalText(req.body?.imagenTarjeta, 500),
    notaCantidad: optionalText(req.body?.notaCantidad, 160),
    ...availabilityFields(req.body ?? {}),
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
    ...availabilityFields(req.body ?? {}),
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
