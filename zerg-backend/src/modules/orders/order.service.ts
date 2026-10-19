import { getPrisma } from "../../config/database.js";
import { NotFoundError, BadRequestError } from "../../errors/appError.js";

export const getAll = async () => {
  return getPrisma().order.findMany({
    include: {
      items: {
        include: {
          plan: {
            select: { id: true, nombre: true, precio: true, duracion: true, product: { select: { nombre: true, slug: true } } },
          },
        },
      },
      user: {
        select: { id: true, nombre: true, email: true },
      },
    },
    orderBy: { creadoEn: "desc" },
  });
};

export const getById = async (id: string) => {
  const order = await getPrisma().order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          plan: {
            select: { id: true, nombre: true, precio: true, duracion: true },
          },
        },
      },
      user: {
        select: { id: true, nombre: true, email: true },
      },
    },
  });

  if (!order) {
    throw new NotFoundError("Orden no encontrada");
  }

  return order;
};

export const create = async (data: {
  nombreCliente: string;
  email: string;
  telefono?: string;
  whatsappLink?: string;
  notas?: string;
  userId?: string;
  items: { planId: string; cantidad: number }[];
}) => {
  if (!data.items || data.items.length === 0) {
    throw new BadRequestError("La orden debe tener al menos un item");
  }

  let total = 0;
  const orderItems = [];

  for (const item of data.items) {
    const plan = await getPrisma().plan.findUnique({
      where: { id: item.planId },
    });

    if (!plan) {
      throw new NotFoundError(`Plan no encontrado: ${item.planId}`);
    }

    if (!plan.isActivo) {
      throw new BadRequestError(`Plan inactivo: ${plan.nombre}`);
    }

    const subtotal = Number(plan.precio) * item.cantidad;
    total += subtotal;

    orderItems.push({
      planId: item.planId,
      cantidad: item.cantidad,
      precioUnitario: plan.precio,
    });
  }

  const numeroOrden = `ORD-${Date.now()}`;

  return getPrisma().order.create({
    data: {
      numeroOrden,
      nombreCliente: data.nombreCliente,
      email: data.email,
      telefono: data.telefono,
      whatsappLink: data.whatsappLink,
      notas: data.notas,
      userId: data.userId,
      total,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: {
          plan: { select: { id: true, nombre: true, precio: true } },
        },
      },
    },
  });
};

export const updateStatus = async (
  id: string,
  status: "PENDIENTE" | "ENVIADO" | "COMPLETADO" | "CANCELADO"
) => {
  const order = await getPrisma().order.findUnique({ where: { id } });

  if (!order) {
    throw new NotFoundError("Orden no encontrada");
  }

  return getPrisma().order.update({
    where: { id },
    data: { status },
    include: {
      items: true,
    },
  });
};

export const remove = async (id: string) => {
  const order = await getPrisma().order.findUnique({ where: { id } });

  if (!order) {
    throw new NotFoundError("Orden no encontrada");
  }

  await getPrisma().orderItem.deleteMany({ where: { orderId: id } });
  await getPrisma().order.delete({ where: { id } });

  return { message: "Orden eliminada exitosamente" };
};
