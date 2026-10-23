import { randomBytes, createHash } from "crypto";
import { getPrisma } from "../../config/database.js";
import { ConflictError, AppError } from "../../errors/appError.js";
import { emit } from "../../realtime/events.js";
import { notifyAdmins } from "../notifications/notification.service.js";
import { insideWindow, normalizePhone, sendTemplate, sendText, whatsappConfig } from "./whatsapp.client.js";

export const WHATSAPP_TEMA = "WhatsApp";

interface IncomingMessage {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { caption?: string; filename?: string };
}

interface WebhookPayload {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: {
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: IncomingMessage[];
      };
    }[];
  }[];
}

const MEDIA: Record<string, string> = {
  image: "📷 Imagen",
  video: "🎬 Video",
  audio: "🎤 Audio",
  voice: "🎤 Nota de voz",
  document: "📄 Documento",
  sticker: "Sticker",
  location: "📍 Ubicación",
  contacts: "👤 Contacto",
};

// Texto que se guarda en el chat del admin. Los archivos no se descargan: se indica qué llegó para verlo en el celular.
export function messageText(m: IncomingMessage) {
  if (m.type === "text") return m.text?.body?.trim() || null;
  if (m.type === "button") return m.button?.text?.trim() || null;
  if (m.type === "interactive") return (m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title)?.trim() || null;
  const label = m.type ? MEDIA[m.type] : undefined;
  if (!label) return null;
  const caption = m.image?.caption ?? m.video?.caption ?? m.document?.caption ?? m.document?.filename;
  return `[${label}${caption ? `: ${caption}` : ""} — ábrelo en WhatsApp]`;
}

/** Guarda en la bandeja del admin los mensajes que llegan al número de WhatsApp Business. */
export async function handleWebhook(payload: WebhookPayload) {
  let saved = 0;
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field && change.field !== "messages") continue;
      const contacts = change.value?.contacts ?? [];
      for (const m of change.value?.messages ?? []) {
        const waId = m.from?.replace(/\D/g, "");
        const texto = messageText(m)?.slice(0, 1000);
        if (!waId || !m.id || !texto) continue;
        const nombre = contacts.find((c) => c.wa_id === m.from)?.profile?.name?.trim().slice(0, 80) || `+${waId}`;
        if (await receive({ waId, waMessageId: m.id, nombre, texto, at: m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date() })) saved++;
      }
    }
  }
  if (saved > 0) emit("support");
  return saved;
}

async function receive(input: { waId: string; waMessageId: string; nombre: string; texto: string; at: Date }) {
  const prisma = getPrisma();
  // Meta reintenta el webhook si tardamos: el id del mensaje evita guardarlo dos veces.
  if (await prisma.message.findUnique({ where: { waMessageId: input.waMessageId } })) return false;

  const existing = await prisma.conversation.findUnique({ where: { waId: input.waId } });
  if (!existing) {
    const conversation = await prisma.conversation.create({
      data: {
        tema: WHATSAPP_TEMA,
        nombre: input.nombre,
        telefono: `+${input.waId}`,
        canal: "WHATSAPP",
        waId: input.waId,
        // El cliente no usa el chat web: el token solo cumple con la columna única.
        tokenHash: createHash("sha256").update(randomBytes(32)).digest("hex"),
        noLeidasAdmin: 1,
        ultimoEntranteEn: input.at,
        ultimoMensajeEn: input.at,
        messages: { create: { autor: "CLIENTE", texto: input.texto, waMessageId: input.waMessageId, creadoEn: input.at } },
      },
    });
    await notifyAdmins({ tipo: "MENSAJE", titulo: "Nuevo chat por WhatsApp", mensaje: `${input.nombre}: ${input.texto.slice(0, 80)}`, href: `/chat?c=${conversation.id}` });
    return true;
  }

  await prisma.$transaction([
    prisma.message.create({ data: { conversationId: existing.id, autor: "CLIENTE", texto: input.texto, waMessageId: input.waMessageId, creadoEn: input.at } }),
    prisma.conversation.update({
      where: { id: existing.id },
      data: { estado: "ABIERTA", noLeidasAdmin: { increment: 1 }, ultimoEntranteEn: input.at, ultimoMensajeEn: input.at },
    }),
  ]);
  if (existing.estado === "CERRADA") {
    await notifyAdmins({ tipo: "MENSAJE", titulo: "Chat de WhatsApp reabierto", mensaje: `${existing.nombre}: ${input.texto.slice(0, 80)}`, href: `/chat?c=${existing.id}` });
  }
  return true;
}

function requireConfig() {
  const config = whatsappConfig();
  if (!config) throw new AppError("WhatsApp Business no está conectado. Completa las variables WHATSAPP_* del backend.", 503);
  return config;
}

/**
 * Respuesta del admin en un chat de WhatsApp. Dentro de las 24 h va como texto libre;
 * fuera de ellas, con la plantilla WHATSAPP_TEMPLATE_REPLY (si existe) llevando el texto como variable.
 */
export async function replyToChat(conversation: { waId: string | null; ultimoEntranteEn: Date | null }, texto: string) {
  const config = requireConfig();
  if (!conversation.waId) throw new ConflictError("Este chat no tiene número de WhatsApp");
  if (insideWindow(conversation.ultimoEntranteEn)) return sendText(config, conversation.waId, texto);
  if (config.templates.reply) return sendTemplate(config, conversation.waId, config.templates.reply, [texto]);
  throw new ConflictError(
    "Pasaron más de 24 h desde el último mensaje del cliente. WhatsApp solo permite escribirle con una plantilla aprobada: configura WHATSAPP_TEMPLATE_REPLY o espera a que el cliente escriba."
  );
}

/**
 * Envía las credenciales de un pedido. Si el cliente nos escribió en las últimas 24 h va el texto completo;
 * si no, la plantilla WHATSAPP_TEMPLATE_CREDENTIALS con {{1}} nombre, {{2}} n.º de pedido y {{3}} accesos.
 */
export async function sendCredentials(phone: string | null | undefined, input: { nombre: string; numeroOrden: string; detalle: string; texto: string }) {
  const config = requireConfig();
  const to = normalizePhone(phone, config.countryCode);
  if (!to) throw new ConflictError("El pedido no tiene un número de WhatsApp válido");

  const chat = await getPrisma().conversation.findUnique({ where: { waId: to }, select: { ultimoEntranteEn: true } });
  if (insideWindow(chat?.ultimoEntranteEn)) return sendText(config, to, input.texto);
  if (config.templates.credentials) {
    return sendTemplate(config, to, config.templates.credentials, [input.nombre, input.numeroOrden, input.detalle]);
  }
  throw new ConflictError(
    "El cliente no escribió a tu WhatsApp en las últimas 24 h. Para enviarle primero, crea y aprueba una plantilla en Meta y ponla en WHATSAPP_TEMPLATE_CREDENTIALS."
  );
}

/** Estado de la conexión para el panel (sin secretos). */
export function status() {
  const config = whatsappConfig();
  return {
    conectado: Boolean(config),
    numeroId: config ? `…${config.phoneNumberId.slice(-4)}` : null,
    plantillaRespuesta: config?.templates.reply ?? null,
    plantillaCredenciales: config?.templates.credentials ?? null,
    webhook: process.env.BACKEND_PUBLIC_URL?.trim() ? `${process.env.BACKEND_PUBLIC_URL.trim().replace(/\/$/, "")}/api/whatsapp/webhook` : null,
  };
}
