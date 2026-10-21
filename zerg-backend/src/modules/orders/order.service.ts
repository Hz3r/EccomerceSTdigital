import { getPrisma } from "../../config/database.js";
import { NotFoundError, BadRequestError } from "../../errors/appError.js";
import { notifyAdmins, notifyUser } from "../notifications/notification.service.js";
import type { TokenPayload } from "../../utils/token.js";

const money = (value: unknown) => `S/ ${Number(value).toFixed(2)}`;

// Detalle de los ítems con el producto, para el admin y para "Mis pedidos" del cliente.
const itemsWithProduct = {
  include: {
    plan: {
      select: {
        id: true,
        nombre: true,
        precio: true,
        duracion: true,
        product: { select: { nombre: true, slug: true, imagenUrl: true } },
      },
    },
  },
} as const;

// Lo que ve el cliente sobre el avance de su pedido.
const STATUS_COPY: Record<string, { titulo: string; mensaje: (numero: string) => string }> = {
  PENDIENTE: { titulo: "Pedido en revisión", mensaje: (n) => `Tu pedido ${n} volvió a estado pendiente.` },
  ENVIADO: { titulo: "Pedido enviado", mensaje: (n) => `Enviamos los accesos de tu pedido ${n}. Revisa tu correo y WhatsApp.` },
  COMPLETADO: { titulo: "Pedido completado", mensaje: (n) => `Tu pedido ${n} está completado. ¡Gracias por tu compra!` },
  CANCELADO: { titulo: "Pedido cancelado", mensaje: (n) => `Tu pedido ${n} fue cancelado. Escríbenos si tienes dudas.` },
};

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

// Pedidos del cliente que inició sesión (más recientes primero).
export const getMine = async (userId: string) => {
  return getPrisma().order.findMany({
    where: { userId },
    include: { items: itemsWithProduct },
    orderBy: { creadoEn: "desc" },
  });
};

// Un admin ve cualquier orden; un cliente solo las suyas (las ajenas responden "no encontrada").
export const getById = async (id: string, viewer?: TokenPayload) => {
  const order = await getPrisma().order.findUnique({
    where: { id },
    include: {
      items: itemsWithProduct,
      user: {
        select: { id: true, nombre: true, email: true },
      },
    },
  });

  if (!order || (viewer && viewer.rol !== "ADMIN" && order.userId !== viewer.userId)) {
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

  const order = await getPrisma().order.create({
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

  await notifyAdmins({
    tipo: "COMPRA",
    titulo: "Nueva orden de compra",
    mensaje: `${order.numeroOrden} · ${order.nombreCliente} · ${money(order.total)}`,
    href: `/orders?q=${order.numeroOrden}`,
    orderId: order.id,
  });
  if (order.userId) {
    await notifyUser(order.userId, {
      tipo: "PEDIDO",
      titulo: "Recibimos tu pedido",
      mensaje: `Tu pedido ${order.numeroOrden} por ${money(order.total)} está en revisión. Te avisaremos cuando enviemos tus accesos.`,
      href: `/account?orden=${order.numeroOrden}`,
      orderId: order.id,
    });
  }

  return order;
};

export const updateStatus = async (
  id: string,
  status: "PENDIENTE" | "ENVIADO" | "COMPLETADO" | "CANCELADO"
) => {
  const order = await getPrisma().order.findUnique({ where: { id } });

  if (!order) {
    throw new NotFoundError("Orden no encontrada");
  }

  const updated = await getPrisma().order.update({
    where: { id },
    data: { status },
    include: {
      items: true,
    },
  });

  if (order.status !== status) {
    const copy = STATUS_COPY[status];
    if (order.userId && copy) {
      await notifyUser(order.userId, {
        tipo: "PEDIDO",
        titulo: copy.titulo,
        mensaje: copy.mensaje(order.numeroOrden),
        href: `/account?orden=${order.numeroOrden}`,
        orderId: order.id,
      });
    }
    if (status === "COMPLETADO") {
      await notifyAdmins({
        tipo: "VENTA",
        titulo: "Venta completada",
        mensaje: `${order.numeroOrden} · ${order.nombreCliente} · ${money(order.total)}`,
        href: `/orders?q=${order.numeroOrden}`,
        orderId: order.id,
      });
    }
  }

  return updated;
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
