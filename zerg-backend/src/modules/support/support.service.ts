import { createHash, randomBytes } from "crypto";
import type { EstadoConversacion } from "@prisma/client";
import { getPrisma } from "../../config/database.js";
import { BadRequestError, NotFoundError } from "../../errors/appError.js";
import { emit } from "../../realtime/events.js";
import type { TokenPayload } from "../../utils/token.js";
import { notifyAdmins, notifyUser } from "../notifications/notification.service.js";

// "Entradas" del chat: el cliente elige de qué quiere hablar y el admin puede filtrar por tema.
export const TEMAS = ["Quiero comprar", "Mi pedido", "Pagos", "Problemas con mi acceso", "Otro"] as const;
const MAX_TEXT = 1000;
const MAX_MESSAGES = 200;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function cleanText(value: unknown, field = "El mensaje") {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new BadRequestError(`${field} no puede estar vacío`);
  if (text.length > MAX_TEXT) throw new BadRequestError(`${field} no puede superar los ${MAX_TEXT} caracteres`);
  return text;
}

const optional = (value: unknown, max: number) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);

const messagesOf = (conversationId: string) =>
  getPrisma().message.findMany({
    where: { conversationId },
    select: { id: true, autor: true, texto: true, creadoEn: true },
    orderBy: { creadoEn: "asc" },
    take: MAX_MESSAGES,
  });

const publicConversation = (c: { id: string; tema: string; nombre: string; estado: EstadoConversacion; creadoEn: Date }) => ({
  id: c.id,
  tema: c.tema,
  nombre: c.nombre,
  estado: c.estado,
  creadoEn: c.creadoEn,
});

// ==================== Cliente (tienda) ====================

/** Inicia un chat. Devuelve un token secreto que el navegador guarda para seguir la conversación. */
export async function start(viewer: TokenPayload | undefined, input: Record<string, unknown>) {
  const tema = typeof input.tema === "string" && (TEMAS as readonly string[]).includes(input.tema) ? input.tema : null;
  if (!tema) throw new BadRequestError("Elige un tema para el chat");
  const texto = cleanText(input.mensaje);

  const user = viewer ? await getPrisma().user.findUnique({ where: { id: viewer.userId }, select: { id: true, nombre: true, email: true } }) : null;
  const nombre = optional(input.nombre, 80) ?? user?.nombre;
  if (!nombre) throw new BadRequestError("Escribe tu nombre");
  const email = optional(input.email, 120) ?? user?.email ?? null;
  const telefono = optional(input.telefono, 30);

  const token = randomBytes(32).toString("hex");
  const conversation = await getPrisma().conversation.create({
    data: {
      tema,
      nombre,
      email,
      telefono,
      userId: user?.id,
      tokenHash: hashToken(token),
      noLeidasAdmin: 1,
      messages: { create: { autor: "CLIENTE", texto } },
    },
  });

  await notifyAdmins({
    tipo: "MENSAJE",
    titulo: "Nuevo chat de soporte",
    mensaje: `${nombre} · ${tema}: ${texto.slice(0, 80)}`,
    href: `/chat?c=${conversation.id}`,
  });
  emit("support", "created");
  return { token, conversation: publicConversation(conversation), messages: await messagesOf(conversation.id) };
}

// El visitante se identifica con su token; un cliente con sesión también puede volver a su último chat.
async function resolve(viewer: TokenPayload | undefined, token: string | undefined) {
  const byToken = token ? await getPrisma().conversation.findUnique({ where: { tokenHash: hashToken(token) } }) : null;
  if (byToken) return byToken;
  if (viewer) {
    const mine = await getPrisma().conversation.findFirst({ where: { userId: viewer.userId }, orderBy: { ultimoMensajeEn: "desc" } });
    if (mine) return mine;
  }
  return null;
}

export async function current(viewer: TokenPayload | undefined, token: string | undefined) {
  const conversation = await resolve(viewer, token);
  if (!conversation) return null;
  if (conversation.noLeidasCliente > 0) {
    await getPrisma().conversation.update({ where: { id: conversation.id }, data: { noLeidasCliente: 0 } });
  }
  return { conversation: publicConversation(conversation), messages: await messagesOf(conversation.id), noLeidas: conversation.noLeidasCliente };
}

export async function send(viewer: TokenPayload | undefined, token: string | undefined, input: Record<string, unknown>) {
  const conversation = await resolve(viewer, token);
  if (!conversation) throw new NotFoundError("No encontramos tu chat. Inicia uno nuevo.");
  const texto = cleanText(input.texto);

  const [message] = await getPrisma().$transaction([
    getPrisma().message.create({ data: { conversationId: conversation.id, autor: "CLIENTE", texto }, select: { id: true, autor: true, texto: true, creadoEn: true } }),
    getPrisma().conversation.update({
      where: { id: conversation.id },
      // Si el admin lo había cerrado, un mensaje nuevo lo vuelve a abrir
      data: { estado: "ABIERTA", noLeidasAdmin: { increment: 1 }, ultimoMensajeEn: new Date() },
    }),
  ]);

  if (conversation.estado === "CERRADA") {
    await notifyAdmins({ tipo: "MENSAJE", titulo: "Chat reabierto", mensaje: `${conversation.nombre}: ${texto.slice(0, 80)}`, href: `/chat?c=${conversation.id}` });
  }
  emit("support");
  return message;
}

// ==================== Admin ====================

export async function list(filters: { estado?: unknown; tema?: unknown }) {
  const estado = filters.estado === "ABIERTA" || filters.estado === "CERRADA" ? filters.estado : undefined;
  const tema = typeof filters.tema === "string" && (TEMAS as readonly string[]).includes(filters.tema) ? filters.tema : undefined;
  const conversations = await getPrisma().conversation.findMany({
    where: { ...(estado && { estado }), ...(tema && { tema }) },
    orderBy: { ultimoMensajeEn: "desc" },
    take: 100,
    select: {
      id: true,
      tema: true,
      nombre: true,
      email: true,
      telefono: true,
      canal: true,
      estado: true,
      noLeidasAdmin: true,
      ultimoMensajeEn: true,
      creadoEn: true,
      user: { select: { id: true, nombre: true, email: true } },
      messages: { select: { autor: true, texto: true, creadoEn: true }, orderBy: { creadoEn: "desc" }, take: 1 },
    },
  });
  return conversations.map(({ messages, ...c }) => ({ ...c, ultimoMensaje: messages[0] ?? null }));
}

async function findForAdmin(id: string) {
  const conversation = await getPrisma().conversation.findUnique({
    where: { id },
    select: {
      id: true,
      tema: true,
      nombre: true,
      email: true,
      telefono: true,
      canal: true,
      estado: true,
      noLeidasAdmin: true,
      creadoEn: true,
      userId: true,
      user: { select: { id: true, nombre: true, email: true } },
    },
  });
  if (!conversation) throw new NotFoundError("Conversación no encontrada");
  return conversation;
}

export async function getForAdmin(id: string) {
  const conversation = await findForAdmin(id);
  if (conversation.noLeidasAdmin > 0) {
    await getPrisma().conversation.update({ where: { id }, data: { noLeidasAdmin: 0 } });
    emit("support");
  }
  const { noLeidasAdmin: _read, ...rest } = conversation;
  return { conversation: rest, messages: await messagesOf(id) };
}

export async function reply(id: string, input: Record<string, unknown>) {
  const conversation = await findForAdmin(id);
  const texto = cleanText(input.texto, "La respuesta");

  const [message] = await getPrisma().$transaction([
    getPrisma().message.create({ data: { conversationId: id, autor: "ADMIN", texto }, select: { id: true, autor: true, texto: true, creadoEn: true } }),
    getPrisma().conversation.update({
      where: { id },
      data: { estado: "ABIERTA", noLeidasAdmin: 0, noLeidasCliente: { increment: 1 }, ultimoMensajeEn: new Date() },
    }),
  ]);

  if (conversation.userId) {
    await notifyUser(conversation.userId, {
      tipo: "MENSAJE",
      titulo: "Soporte te respondió",
      mensaje: texto.slice(0, 120),
      href: "/?chat=1",
    });
  }
  emit("support");
  return message;
}

export async function setEstado(id: string, estado: unknown) {
  if (estado !== "ABIERTA" && estado !== "CERRADA") throw new BadRequestError("Estado no válido");
  await findForAdmin(id);
  await getPrisma().conversation.update({ where: { id }, data: { estado } });
  emit("support");
  return { id, estado };
}

/** Chats con mensajes sin leer, para el contador del menú del admin. */
export async function unreadCount() {
  return getPrisma().conversation.count({ where: { noLeidasAdmin: { gt: 0 } } });
}
