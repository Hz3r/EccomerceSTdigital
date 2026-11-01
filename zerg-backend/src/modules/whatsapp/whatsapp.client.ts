import { createHmac, timingSafeEqual } from "crypto";
import { AppError } from "../../errors/appError.js";
import { effective, panelWhatsapp } from "./whatsapp.settings.js";

// WhatsApp Business (Cloud API de Meta). Se configura en developers.facebook.com → tu app → WhatsApp:
// token permanente (usuario del sistema), Phone Number ID, App Secret y un "verify token" inventado por ti.
// Webhook a registrar en Meta: <BACKEND_PUBLIC_URL>/api/whatsapp/webhook (campo "messages").
// Los datos se cargan en el panel (Contenido del sitio → WhatsApp) o, como respaldo, en las variables WHATSAPP_* del .env.

export interface WhatsappConfig {
  token: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret: string;
  version: string;
  countryCode: string;
  language: string;
  templates: { reply?: string; credentials?: string };
}

export function whatsappConfig(): WhatsappConfig | null {
  if (!panelWhatsapp().activo) return null;
  const token = effective("token");
  const phoneNumberId = effective("phoneNumberId");
  const verifyToken = effective("verifyToken");
  const appSecret = effective("appSecret");
  if (!token || !phoneNumberId || !verifyToken || !appSecret) return null;
  return {
    token,
    phoneNumberId,
    verifyToken,
    appSecret,
    version: effective("version") || "v21.0",
    countryCode: (effective("countryCode") || "51").replace(/\D/g, ""),
    language: effective("language") || "es",
    templates: {
      reply: effective("templateReply") || undefined,
      credentials: effective("templateCredentials") || undefined,
    },
  };
}

/** Número en formato internacional sin "+" ni espacios. Un celular peruano de 9 dígitos recibe el código de país. */
export function normalizePhone(raw: string | null | undefined, countryCode = "51") {
  let digits = (raw ?? "").replace(/\D/g, "").replace(/^00/, "");
  if (digits.length === 9 && digits.startsWith("9")) digits = countryCode + digits;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

// Fuera de la ventana de 24 h WhatsApp solo deja enviar plantillas aprobadas.
export const WINDOW_MS = 24 * 60 * 60 * 1000;
export const insideWindow = (lastIncoming: Date | null | undefined, now = Date.now()) =>
  Boolean(lastIncoming && now - lastIncoming.getTime() < WINDOW_MS);

/** Firma del webhook: cabecera X-Hub-Signature-256 = "sha256=" + HMAC-SHA256 del cuerpo con el App Secret. */
export function isValidSignature(rawBody: Buffer, header: string | undefined, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", appSecret).update(rawBody).digest("hex"));
  const received = Buffer.from(header.slice("sha256=".length));
  return expected.length === received.length && timingSafeEqual(expected, received);
}

// Las variables de una plantilla no aceptan saltos de línea ni tabulaciones.
export const templateParam = (text: string) => text.replace(/[\r\n\t]+/g, " · ").replace(/ {4,}/g, "   ").trim().slice(0, 1000);

async function post(config: WhatsappConfig, payload: Record<string, unknown>): Promise<string> {
  const res = await fetch(`https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
  }).catch(() => null);

  const body = (await res?.json().catch(() => null)) as { messages?: { id: string }[]; error?: { code?: number; message?: string } } | null;
  const id = body?.messages?.[0]?.id;
  if (res?.ok && id) return id;

  console.error("[whatsapp] Envío fallido:", body?.error?.code, body?.error?.message ?? res?.status);
  if (body?.error?.code === 131047) {
    throw new AppError("Pasaron más de 24 h desde el último mensaje del cliente: WhatsApp solo permite enviarle una plantilla aprobada.", 409);
  }
  if (body?.error?.code === 190) throw new AppError("El token de WhatsApp venció o no es válido. Actualízalo en Contenido del sitio → WhatsApp.", 502);
  throw new AppError(`WhatsApp no aceptó el mensaje${body?.error?.message ? `: ${body.error.message}` : ""}.`, 502);
}

export const sendText = (config: WhatsappConfig, to: string, text: string) =>
  post(config, { to, type: "text", text: { preview_url: true, body: text.slice(0, 4096) } });

export const sendTemplate = (config: WhatsappConfig, to: string, name: string, params: string[]) =>
  post(config, {
    to,
    type: "template",
    template: {
      name,
      language: { code: config.language },
      ...(params.length > 0 && {
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text: templateParam(text) })) }],
      }),
    },
  });

/** Comprueba el token y el Phone Number ID consultando el número en Meta (no envía mensajes). */
export async function checkConnection(config: Pick<WhatsappConfig, "token" | "phoneNumberId" | "version">) {
  const url = `https://graph.facebook.com/${config.version}/${config.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${config.token}` } }).catch(() => null);
  if (!res) throw new AppError("No se pudo conectar con Meta. Revisa la conexión a internet del servidor.", 502);
  const body = (await res.json().catch(() => null)) as {
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
    error?: { code?: number; message?: string };
  } | null;
  if (res.ok && body?.display_phone_number) {
    return { numero: body.display_phone_number, nombre: body.verified_name ?? null, calidad: body.quality_rating ?? null };
  }
  if (body?.error?.code === 190) throw new AppError("Meta rechazó el token: venció o no es válido.", 502);
  if (body?.error?.code === 100) throw new AppError("Meta no encontró ese Phone Number ID o el token no tiene acceso a él.", 502);
  throw new AppError(`Meta respondió con un error${body?.error?.message ? `: ${body.error.message}` : ""}.`, 502);
}
