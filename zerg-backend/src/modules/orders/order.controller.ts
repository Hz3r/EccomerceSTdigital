import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as orderService from "./order.service.js";
import { parseMetodo } from "../payments/payment.service.js";

export const getAll = async (_req: AuthRequest, res: Response) => {
  const orders = await orderService.getAll();

  res.status(200).json({
    success: true,
    data: orders,
  });
};

export const getMine = async (req: AuthRequest, res: Response) => {
  const orders = await orderService.getMine(req.user!.userId);

  res.status(200).json({
    success: true,
    data: orders,
  });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const order = await orderService.getById(id, req.user);

  res.status(200).json({
    success: true,
    data: order,
  });
};

export const create = async (req: AuthRequest, res: Response) => {
  const { nombreCliente, email, telefono, whatsappLink, notas, items, metodoPago } =
    req.body;
  const userId = req.user?.userId;

  const order = await orderService.create({
    nombreCliente,
    email,
    telefono,
    whatsappLink,
    notas,
    userId,
    items,
    metodoPago: parseMetodo(metodoPago),
  });

  res.status(201).json({
    success: true,
    message: "Orden creada exitosamente",
    data: order,
  });
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  const order = await orderService.updateStatus(id, status);

  res.status(200).json({
    success: true,
    message: "Estado de orden actualizado",
    data: order,
  });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const result = await orderService.remove(id);

  res.status(200).json({
    success: true,
    ...result,
  });
};
