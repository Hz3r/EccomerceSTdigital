import { getPrisma } from "../../config/database.js";
import { BadRequestError, NotFoundError } from "../../errors/appError.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface SubscribeInput {
  nombre?: unknown;
  email?: unknown;
}

/**
 * Alta desde el formulario de la tienda. Si el correo ya existe se reactiva y se actualiza
 * el nombre, sin avisar que ya estaba (así no se puede averiguar quién está suscrito).
 */
export const subscribe = async (input: SubscribeInput) => {
  const nombre = typeof input.nombre === "string" ? input.nombre.trim().slice(0, 80) : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";

  if (!nombre) throw new BadRequestError("Escribe tu nombre");
  if (!email || email.length > 160 || !EMAIL_RE.test(email)) throw new BadRequestError("Escribe un correo válido");

  await getPrisma().subscriber.upsert({
    where: { email },
    create: { nombre, email },
    update: { nombre, activo: true },
  });

  return { message: "¡Listo! Te avisaremos de las próximas ofertas." };
};

export const list = async () => {
  const subscribers = await getPrisma().subscriber.findMany({ orderBy: { creadoEn: "desc" } });
  return {
    subscribers,
    total: subscribers.length,
    activos: subscribers.filter((s) => s.activo).length,
  };
};

const ensure = async (id: string) => {
  const found = await getPrisma().subscriber.findUnique({ where: { id } });
  if (!found) throw new NotFoundError("Suscriptor no encontrado");
  return found;
};

export const setActivo = async (id: string, activo: unknown) => {
  if (typeof activo !== "boolean") throw new BadRequestError("Indica si el suscriptor está activo");
  await ensure(id);
  return getPrisma().subscriber.update({ where: { id }, data: { activo } });
};

export const remove = async (id: string) => {
  await ensure(id);
  await getPrisma().subscriber.delete({ where: { id } });
  return { message: "Suscriptor eliminado" };
};

// Texto seguro para CSV: comillas dobles y sin fórmulas (Excel ejecuta celdas que empiezan con = + - @).
const csvCell = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** CSV para importar en Mailchimp, Brevo, etc. Con BOM para que Excel lea bien las tildes. */
export const exportCsv = async (soloActivos: boolean) => {
  const subscribers = await getPrisma().subscriber.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { creadoEn: "asc" },
  });
  const rows = subscribers.map((s) =>
    [s.nombre, s.email, s.activo ? "activo" : "baja", s.creadoEn.toISOString().slice(0, 10)].map(csvCell).join(",")
  );
  return "﻿" + ["nombre,email,estado,fecha", ...rows].join("\r\n") + "\r\n";
};
