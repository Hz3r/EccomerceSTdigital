import type { TipoNotificacion } from "@prisma/client";
import { getPrisma } from "../../config/database.js";
import { NotFoundError } from "../../errors/appError.js";
import { emit } from "../../realtime/events.js";
import type { TokenPayload } from "../../utils/token.js";

export interface NotificationInput {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  href?: string;
  orderId?: string;
}

const MAX_LIMIT = 50;

// Una notificación nunca debe impedir una compra o una reseña: si falla se registra y se sigue.
async function safeCreate(data: Parameters<ReturnType<typeof getPrisma>["notification"]["create"]>[0]["data"]) {
  try {
    await getPrisma().notification.create({ data });
    emit("notifications", "created");
  } catch (err) {
    console.error("[notifications] No se pudo crear la notificación:", err);
  }
}

/** Aviso para el panel admin (lo ven todos los administradores). */
export const notifyAdmins = (input: NotificationInput) => safeCreate({ ...input, audiencia: "ADMIN" });

/** Aviso para un cliente concreto. */
export const notifyUser = (userId: string, input: NotificationInput) => safeCreate({ ...input, audiencia: "CLIENTE", userId });

// Cada usuario solo ve lo suyo: los admin los avisos del panel; los clientes, sus propios avisos.
function scope(user: TokenPayload) {
  return user.rol === "ADMIN" ? { audiencia: "ADMIN" as const } : { audiencia: "CLIENTE" as const, userId: user.userId };
}

const TIPOS: TipoNotificacion[] = ["COMPRA", "VENTA", "PEDIDO", "RESENA"];

export const parseTipo = (value: unknown): TipoNotificacion | undefined =>
  typeof value === "string" && (TIPOS as string[]).includes(value.toUpperCase()) ? (value.toUpperCase() as TipoNotificacion) : undefined;

export const list = async (user: TokenPayload, options: { tipo?: TipoNotificacion; limit?: number } = {}) => {
  const where = scope(user);
  const take = Math.min(Math.max(Number(options.limit) || 20, 1), MAX_LIMIT);
  const prisma = getPrisma();

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { ...where, ...(options.tipo && { tipo: options.tipo }) },
      orderBy: { creadoEn: "desc" },
      take,
    }),
    prisma.notification.groupBy({ by: ["tipo"], where: { ...where, leida: false }, _count: { _all: true } }),
  ]);

  const unreadByTipo = Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<TipoNotificacion, number>;
  for (const row of unread) unreadByTipo[row.tipo] = row._count._all;
  const unreadTotal = Object.values(unreadByTipo).reduce((a, b) => a + b, 0);

  return { items, unread: unreadTotal, unreadByTipo };
};

export const markRead = async (user: TokenPayload, id: string) => {
  const { count } = await getPrisma().notification.updateMany({ where: { id, ...scope(user) }, data: { leida: true } });
  if (count === 0) throw new NotFoundError("Notificación no encontrada");
  return { id, leida: true };
};

export const markAllRead = async (user: TokenPayload, tipo?: TipoNotificacion) => {
  const { count } = await getPrisma().notification.updateMany({
    where: { ...scope(user), leida: false, ...(tipo && { tipo }) },
    data: { leida: true },
  });
  return { updated: count };
};
