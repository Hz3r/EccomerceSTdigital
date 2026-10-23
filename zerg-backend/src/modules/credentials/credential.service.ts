import { getPrisma } from "../../config/database.js";
import { BadRequestError, NotFoundError } from "../../errors/appError.js";
import { emit } from "../../realtime/events.js";
import { decrypt, encrypt } from "../../utils/crypto.js";
import { emailConfigured, escapeHtml, sendEmail } from "../../utils/email.js";
import { notifyUser } from "../notifications/notification.service.js";
import { whatsappConfig } from "../whatsapp/whatsapp.client.js";
import * as whatsappService from "../whatsapp/whatsapp.service.js";

// Datos de acceso que el admin entrega por cada producto del pedido. Se guardan cifrados.
export const CAMPOS = [
  { key: "usuario", label: "Usuario / correo" },
  { key: "contrasena", label: "Contraseña" },
  { key: "perfil", label: "Perfil" },
  { key: "pin", label: "PIN" },
  { key: "enlace", label: "Enlace" },
  { key: "notas", label: "Indicaciones" },
] as const;

type Campo = (typeof CAMPOS)[number]["key"];
export type CredentialData = Partial<Record<Campo, string>>;

export const CANALES = ["WEB", "EMAIL", "WHATSAPP"] as const;
export type Canal = (typeof CANALES)[number];

const MAX_FIELD = 300;
const MAX_NOTES = 1000;

export function parseDatos(input: unknown): CredentialData {
  if (!input || typeof input !== "object") throw new BadRequestError("Escribe los datos de acceso");
  const datos: CredentialData = {};
  for (const { key, label } of CAMPOS) {
    const value = (input as Record<string, unknown>)[key];
    if (value == null || value === "") continue;
    if (typeof value !== "string") throw new BadRequestError(`${label} no es válido`);
    const text = value.trim();
    const max = key === "notas" ? MAX_NOTES : MAX_FIELD;
    if (text.length > max) throw new BadRequestError(`${label}: máximo ${max} caracteres`);
    if (text) datos[key] = text;
  }
  if (Object.keys(datos).length === 0) throw new BadRequestError("Completa al menos un dato de acceso");
  return datos;
}

function parseVence(value: unknown) {
  if (value == null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new BadRequestError("Fecha de vencimiento no válida");
  return date;
}

// Un dato que no se pueda descifrar (clave cambiada) no rompe la página: se muestra como no disponible.
function readDatos(cipher: string): CredentialData | null {
  try {
    return JSON.parse(decrypt(cipher)) as CredentialData;
  } catch (err) {
    console.error("[credentials] No se pudo descifrar una credencial:", (err as Error).message);
    return null;
  }
}

const itemInclude = {
  plan: { select: { nombre: true, duracion: true, product: { select: { nombre: true, slug: true, imagenUrl: true } } } },
  credential: true,
} as const;

type CredentialRow = {
  id: string;
  datos: string;
  venceEn: Date | null;
  publicadoEn: Date | null;
  enviadoCorreoEn: Date | null;
  enviadoWhatsappEn: Date | null;
  vistoEn: Date | null;
  actualizado: Date;
};

const present = (c: CredentialRow) => ({
  id: c.id,
  datos: readDatos(c.datos),
  venceEn: c.venceEn,
  publicadoEn: c.publicadoEn,
  enviadoCorreoEn: c.enviadoCorreoEn,
  enviadoWhatsappEn: c.enviadoWhatsappEn,
  vistoEn: c.vistoEn,
  actualizado: c.actualizado,
});

// ==================== Admin ====================

async function findOrder(orderId: string) {
  const order = await getPrisma().order.findUnique({ where: { id: orderId }, include: { items: { include: itemInclude } } });
  if (!order) throw new NotFoundError("Orden no encontrada");
  return order;
}

/** Productos del pedido con sus credenciales y los canales disponibles para enviarlas. */
export async function getForOrder(orderId: string) {
  const order = await findOrder(orderId);
  return {
    items: order.items.map((item) => ({
      id: item.id,
      cantidad: item.cantidad,
      producto: item.plan.product.nombre,
      plan: item.plan.nombre,
      duracion: item.plan.duracion,
      credential: item.credential ? present(item.credential) : null,
    })),
    canales: {
      WEB: { disponible: Boolean(order.userId), motivo: order.userId ? null : "El pedido no está asociado a una cuenta" },
      EMAIL: {
        disponible: emailConfigured() && Boolean(order.email),
        motivo: !emailConfigured() ? "Configura RESEND_API_KEY y EMAIL_FROM en el backend" : order.email ? null : "El pedido no tiene correo",
      },
      WHATSAPP: {
        disponible: Boolean(whatsappConfig()) && Boolean(order.telefono),
        motivo: !whatsappConfig() ? "Conecta WhatsApp Business (variables WHATSAPP_*)" : order.telefono ? null : "El pedido no tiene teléfono",
      },
    },
    destino: { email: order.email, telefono: order.telefono },
  };
}

export async function save(itemId: string, input: Record<string, unknown>) {
  const item = await getPrisma().orderItem.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) throw new NotFoundError("Producto del pedido no encontrado");
  const data = { datos: encrypt(JSON.stringify(parseDatos(input.datos))), venceEn: parseVence(input.venceEn) };
  const credential = await getPrisma().credential.upsert({ where: { orderItemId: itemId }, create: { orderItemId: itemId, ...data }, update: data });
  emit("orders");
  return present(credential);
}

export async function remove(itemId: string) {
  await getPrisma().credential.deleteMany({ where: { orderItemId: itemId } });
  emit("orders");
  return { orderItemId: itemId };
}

const dateFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "America/Lima" });

interface Delivery {
  titulo: string;
  datos: CredentialData;
  venceEn: Date | null;
}

const lines = (d: Delivery) => [
  ...CAMPOS.filter(({ key }) => d.datos[key]).map(({ key, label }) => `${label}: ${d.datos[key]}`),
  ...(d.venceEn ? [`Vence: ${dateFormat.format(d.venceEn)}`] : []),
];

const accountUrl = () => `${(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "")}/account?tab=accesos`;

export function buildText(nombre: string, numeroOrden: string, deliveries: Delivery[]) {
  const blocks = deliveries.map((d) => [`*${d.titulo}*`, ...lines(d)].join("\n"));
  return [`Hola ${nombre} 👋`, `Tus accesos del pedido ${numeroOrden}:`, ...blocks, `También los tienes en tu cuenta: ${accountUrl()}`].join("\n\n");
}

export const buildDetail = (deliveries: Delivery[]) => deliveries.map((d) => `${d.titulo}: ${lines(d).join(" / ")}`).join(" | ");

function buildHtml(nombre: string, numeroOrden: string, deliveries: Delivery[]) {
  const cards = deliveries
    .map(
      (d) => `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:12px 0">
  <p style="margin:0 0 8px;font-weight:700;font-size:15px">${escapeHtml(d.titulo)}</p>
  ${lines(d)
    .map((l) => {
      const [label, ...rest] = l.split(": ");
      return `<p style="margin:4px 0;font-size:14px"><span style="color:#6b7280">${escapeHtml(label ?? "")}:</span> <strong style="font-family:monospace">${escapeHtml(rest.join(": "))}</strong></p>`;
    })
    .join("\n  ")}
</div>`
    )
    .join("\n");
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111827">
<h2 style="margin:0 0 4px">¡Tus accesos están listos!</h2>
<p style="margin:0 0 12px;color:#4b5563">Hola ${escapeHtml(nombre)}, estos son los datos de tu pedido <strong>${escapeHtml(numeroOrden)}</strong>.</p>
${cards}
<p style="margin:16px 0"><a href="${accountUrl()}" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Ver en mi cuenta</a></p>
<p style="font-size:12px;color:#6b7280">No compartas estos datos. Si algo no funciona, responde este correo o escríbenos por WhatsApp.</p>
</div>`;
}

export const parseCanales = (value: unknown): Canal[] => {
  const list = Array.isArray(value) ? value.filter((c): c is Canal => (CANALES as readonly string[]).includes(c)) : [];
  if (list.length === 0) throw new BadRequestError("Elige por dónde enviar los accesos");
  return [...new Set(list)];
};

/**
 * Envía las credenciales guardadas del pedido por los canales elegidos. Cada canal es independiente:
 * si el correo falla, la web y WhatsApp siguen. El pedido pendiente pasa a "Enviado".
 */
export async function send(orderId: string, canalesInput: unknown) {
  const canales = parseCanales(canalesInput);
  const order = await findOrder(orderId);
  const withCredential = order.items.filter((i) => i.credential);
  if (withCredential.length === 0) throw new BadRequestError("Primero guarda los datos de acceso de al menos un producto");

  const deliveries: Delivery[] = [];
  for (const item of withCredential) {
    const datos = readDatos(item.credential!.datos);
    if (!datos) throw new BadRequestError(`No se pudieron leer los accesos de ${item.plan.product.nombre}. Vuelve a guardarlos.`);
    deliveries.push({ titulo: `${item.plan.product.nombre} · ${item.plan.nombre}`, datos, venceEn: item.credential!.venceEn });
  }
  const ids = withCredential.map((i) => i.credential!.id);
  const nombre = order.nombreCliente.split(" ")[0] || order.nombreCliente;
  const prisma = getPrisma();

  const results: { canal: Canal; ok: boolean; mensaje: string }[] = [];
  const run = async (canal: Canal, task: () => Promise<string>) => {
    try {
      results.push({ canal, ok: true, mensaje: await task() });
    } catch (err) {
      results.push({ canal, ok: false, mensaje: (err as Error).message });
    }
  };

  for (const canal of canales) {
    if (canal === "WEB") {
      await run("WEB", async () => {
        if (!order.userId) throw new BadRequestError("El pedido no está asociado a una cuenta");
        await prisma.credential.updateMany({ where: { id: { in: ids } }, data: { publicadoEn: new Date() } });
        await notifyUser(order.userId, {
          tipo: "PEDIDO",
          titulo: "Tus accesos están listos",
          mensaje: `Ya puedes ver los accesos de tu pedido ${order.numeroOrden} en "Mis accesos".`,
          href: "/account?tab=accesos",
          orderId: order.id,
        });
        return "Publicado en Mis accesos";
      });
    } else if (canal === "EMAIL") {
      await run("EMAIL", async () => {
        await sendEmail({
          to: order.email,
          subject: `Tus accesos del pedido ${order.numeroOrden}`,
          html: buildHtml(nombre, order.numeroOrden, deliveries),
          text: buildText(nombre, order.numeroOrden, deliveries).replace(/\*/g, ""),
        });
        await prisma.credential.updateMany({ where: { id: { in: ids } }, data: { enviadoCorreoEn: new Date() } });
        return `Enviado a ${order.email}`;
      });
    } else {
      await run("WHATSAPP", async () => {
        await whatsappService.sendCredentials(order.telefono, {
          nombre,
          numeroOrden: order.numeroOrden,
          detalle: buildDetail(deliveries),
          texto: buildText(nombre, order.numeroOrden, deliveries),
        });
        await prisma.credential.updateMany({ where: { id: { in: ids } }, data: { enviadoWhatsappEn: new Date() } });
        return `Enviado a ${order.telefono}`;
      });
    }
  }

  if (results.some((r) => r.ok) && order.status === "PENDIENTE") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "ENVIADO" } });
  }
  emit("orders");
  return { results, pendientes: order.items.length - withCredential.length };
}

// ==================== Cliente ====================

/** Accesos publicados de los pedidos del cliente, del más reciente al más antiguo. */
export async function mine(userId: string) {
  const credentials = await getPrisma().credential.findMany({
    where: { publicadoEn: { not: null }, orderItem: { order: { userId } } },
    orderBy: { publicadoEn: "desc" },
    include: { orderItem: { include: { plan: itemInclude.plan, order: { select: { numeroOrden: true, creadoEn: true } } } } },
  });
  return credentials.map((c) => ({
    ...present(c),
    producto: c.orderItem.plan.product,
    plan: c.orderItem.plan.nombre,
    duracion: c.orderItem.plan.duracion,
    numeroOrden: c.orderItem.order.numeroOrden,
    compradoEn: c.orderItem.order.creadoEn,
  }));
}

export async function markSeen(userId: string, id: string) {
  const { count } = await getPrisma().credential.updateMany({
    where: { id, vistoEn: null, publicadoEn: { not: null }, orderItem: { order: { userId } } },
    data: { vistoEn: new Date() },
  });
  return { id, updated: count };
}
