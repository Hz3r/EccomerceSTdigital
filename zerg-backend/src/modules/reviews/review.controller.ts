import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as reviewService from "./review.service.js";

export const getAll = async (_req: AuthRequest, res: Response) => {
  const reviews = await reviewService.getAll();

  res.status(200).json({
    success: true,
    data: reviews,
  });
};

export const getLatest = async (req: AuthRequest, res: Response) => {
  const limit = Number(req.query.limit) || undefined;
  const reviews = await reviewService.getLatest(limit);

  res.status(200).json({
    success: true,
    data: reviews,
  });
};

export const getByProduct = async (req: AuthRequest, res: Response) => {
  const productId = req.params.productId as string;
  const reviews = await reviewService.getByProduct(productId);

  res.status(200).json({
    success: true,
    data: reviews,
  });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const review = await reviewService.getById(id);

  res.status(200).json({
    success: true,
    data: review,
  });
};

export const getMine = async (req: AuthRequest, res: Response) => {
  const reviews = await reviewService.getMine(req.user!.userId);
  res.status(200).json({ success: true, data: reviews });
};

export const create = async (req: AuthRequest, res: Response) => {
  const { puntuacion, comentario, productId } = req.body;
  const userId = req.user?.userId as string;

  const review = await reviewService.create({
    puntuacion,
    comentario,
    productId,
    userId,
  });

  res.status(201).json({
    success: true,
    message: "Reseña creada. Pendiente de aprobación",
    data: review,
  });
};

export const approve = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const isApproved = req.body?.isApproved !== false;
  const review = await reviewService.approve(id, isApproved);

  res.status(200).json({
    success: true,
    message: isApproved ? "Reseña aprobada" : "Reseña ocultada",
    data: review,
  });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.rol === "ADMIN" ? undefined : req.user?.userId;
  const result = await reviewService.remove(id, userId);

  res.status(200).json({
    success: true,
    ...result,
  });
};
