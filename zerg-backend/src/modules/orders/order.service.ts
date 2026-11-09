import { getPrisma } from "../../config/database.js";
import { unlink } from "fs/promises";
import { NotFoundError, BadRequestError, ConflictError } from "../../errors/appError.js";
import { emit } from "../../realtime/events.js";
import { proofPath } from "../payments/payment.storage.js";
import { notifyAdmins, notifyUser } from "../notifications/notification.service.js";
import type { TokenPayload } from "../../utils/token.js";
import type { MetodoPago } from "@prisma/client";
import { assertAvailable, createPending } from "../payments/payment.service.js";

// Último intento de pago de cada orden (estado, método y referencia; nunca el archivo del comprobante).
const latestPayment = {
  select: { id: true, metodo: true, estado: true, monto: true, referencia: true, motivoRechazo: true, comprobante: true, detalle: true, actualizado: true },
  orderBy: { creadoEn: "desc" as const },
  take: 1,
};

// Hacia fuera solo se indica si hay comprobante (el archivo es privado y se pide por /payments/:id/proof).
// Del detalle del proveedor solo sale el medio que eligió el cliente en el pago directo (Yape, Plin…).
function withPublicPayment<T extends { payments?: { comprobante: string | null; detalle: unknown }[] }>(order: T) {
  const { payments, ...rest } = order;
  const last = payments?.[0];
  if (!last) return { ...rest, payment: null };
  const { comprobante, detalle, ...payment } = last;
  const medio = (detalle as { medio?: unknown } | null)?.medio;
  return { ...rest, payment: { ...payment, medio: typeof medio === "string" ? medio : null, tieneComprobante: Boolean(comprobante) } };
}

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
        perfiles: true,
        product: { select: { nombre: true, slug: true, imagenUrl: true } },
      },
    },
  },
} as const;

// Lo que ve el cliente sobre el avance de su pedido.
const STATUS_COPY: Record<string, { titulo: string; mensaje: (numero: string) => string }> = {
  PENDIENTE: { titulo: "Pedido en revisión", mensaje: (n) => `Tu pedido ${n} volvió a estado pendiente.` },
  ENVIADO: { titulo: "Pedido enviado", mensaje: (n) => `Enviamos los accesos de tu pedido ${n}. Míralos en "Mis accesos".` },
  COMPLETADO: { titulo: "Pedido completado", mensaje: (n) => `Tu pedido ${n} está completado. ¡Gracias por tu compra!` },
  CANCELADO: { titulo: "Pedido cancelado", mensaje: (n) => `Tu pedido ${n} fue cancelado. Escríbenos si tienes dudas.` },
};

export const getAll = async () => {
  const orders = await getPrisma().order.findMany({
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
      payments: latestPayment,
    },
    orderBy: { creadoEn: "desc" },
  });
  return orders.map(withPublicPayment);
};

// Pedidos del cliente que inició sesión (más recientes primero).
export const getMine = async (userId: string) => {
  const orders = await getPrisma().order.findMany({
    where: { userId },
    include: { items: itemsWithProduct, payments: latestPayment },
    orderBy: { creadoEn: "desc" },
  });
  return orders.map(withPublicPayment);
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

/** WhatsApp obligatorio: 9 a 15 dígitos (ej. 987 654 321 o +51 987 654 321). Devuelve el número limpio. */
export function normalizePhone(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) {
    throw new BadRequestError("Escribe tu número de WhatsApp (ej. 987 654 321): ahí te enviamos tus accesos");
  }
  return raw.startsWith("+") ? `+${digits}` : digits;
}

// ==================== Una orden sin pagar por cuenta ====================
// Una orden está "sin pagar" mientras siga pendiente y su pago no esté en revisión ni pagado
// (sin comprobante, o con el comprobante rechazado). Para el cliente funciona como un carrito
// reservado: puede pagarla o cancelarla (sus productos vuelven al carrito), pero no crear otra.
const unpaidWhere = (userId: string) => ({
  userId,
  status: "PENDIENTE" as const,
  // Con un intento de pago registrado: las órdenes antiguas sin pagos (antes del módulo de pagos) no se tocan
  payments: { some: {}, none: { estado: { in: ["EN_REVISION" as const, "PAGADO" as const] } } },
});

/** La orden sin pagar del cliente (con lo necesario para devolverla al carrito), o null. */
export const getUnpaid = async (userId: string) => {
  const order = await getPrisma().order.findFirst({
    where: unpaidWhere(userId),
    include: { items: itemsWithProduct, payments: latestPayment },
    orderBy: { creadoEn: "desc" },
  });
  return order ? withPublicPayment(order) : null;
};

/**
 * El cliente cancela su orden sin pagar: se elimina (el admin nunca la ve como pendiente) y
 * devuelve sus productos para que la tienda los regrese al carrito.
 */
export const cancelUnpaid = async (userId: string, numeroOrden: string) => {
  const order = await getPrisma().order.findFirst({
    where: { numeroOrden, userId },
    include: { items: { select: { planId: true, cantidad: true } }, payments: { select: { estado: true, comprobante: true } } },
  });
  if (!order) throw new NotFoundError("Orden no encontrada");
  const settled =
    order.status !== "PENDIENTE" || order.payments.length === 0 || order.payments.some((p) => p.estado === "EN_REVISION" || p.estado === "PAGADO");
  if (settled) {
    throw new ConflictError("Este pedido ya tiene un pago en revisión o confirmado: escríbenos si necesitas cancelarlo");
  }

  // Los ítems no se borran en cascada con la orden: primero ellos (los pagos sí caen solos)
  await getPrisma().$transaction([
    getPrisma().orderItem.deleteMany({ where: { orderId: order.id } }),
    getPrisma().order.delete({ where: { id: order.id } }),
  ]);
  // Un comprobante rechazado ya no sirve: se borra el archivo privado
  for (const p of order.payments) if (p.comprobante) await unlink(proofPath(p.comprobante)).catch(() => {});
  emit("orders", "deleted");
  return { numeroOrden, items: order.items };
};

export const create = async (data: {
  nombreCliente: string;
  /** Opcional en el checkout: si viene vacío se usa el correo de la cuenta (`accountEmail`). */
  email?: string;
  accountEmail?: string;
  telefono?: string;
  whatsappLink?: string;
  notas?: string;
  userId?: string;
  metodoPago?: MetodoPago;
  items: { planId: string; cantidad: number }[];
}) => {
  if (!data.items || data.items.length === 0) {
    throw new BadRequestError("La orden debe tener al menos un item");
  }
  const telefono = normalizePhone(data.telefono);
  const email = (typeof data.email === "string" && data.email.trim()) || data.accountEmail?.trim() || "";
  if (!email) throw new BadRequestError("Falta el correo de la cuenta");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new BadRequestError("El correo no es válido");
  const metodoPago = data.metodoPago ?? "DIRECTO";
  await assertAvailable(metodoPago);

  // Una sola orden sin pagar por cuenta: primero se paga o se cancela la anterior.
  if (data.userId) {
    const unpaid = await getPrisma().order.findFirst({ where: unpaidWhere(data.userId), select: { numeroOrden: true, total: true } });
    if (unpaid) {
      const error = new ConflictError(`Ya tienes un pedido sin pagar (${unpaid.numeroOrden}). Págalo o cancélalo para hacer uno nuevo.`);
      error.data = { code: "PENDING_ORDER", numeroOrden: unpaid.numeroOrden, total: Number(unpaid.total) };
      throw error;
    }
  }

  let total = 0;
  const orderItems = [];

  for (const item of data.items) {
    const plan = await getPrisma().plan.findUnique({
      where: { id: item.planId },
      include: { product: { select: { nombre: true, disponible: true, stock: true } } },
    });

    if (!plan) {
      throw new NotFoundError(`Plan no encontrado: ${item.planId}`);
    }

    if (!plan.isActivo) {
      throw new BadRequestError(`Plan inactivo: ${plan.nombre}`);
    }

    // Disponibilidad del producto (se marca en el admin): agotado o sin unidades suficientes.
    const product = plan.product;
    if (product && (!product.disponible || product.stock === 0)) {
      throw new BadRequestError(`${product.nombre} está agotado por ahora`);
    }
    if (product?.stock != null && item.cantidad > product.stock) {
      throw new BadRequestError(`Solo quedan ${product.stock} disponibles de ${product.nombre}`);
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
      email,
      telefono,
      whatsappLink: data.whatsappLink,
      notas: data.notas,
      userId: data.userId,
      metodoPago,
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

  await createPending(order.id, metodoPago, order.total);
  // Sin avisos al crearla: una orden sin pagar es solo una reserva del cliente. El admin recibe el
  // aviso cuando llega el comprobante o se confirma el pago (ver payments).

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
