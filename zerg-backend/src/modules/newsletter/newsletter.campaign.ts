import { createHmac, timingSafeEqual } from "crypto";
import { getPrisma } from "../../config/database.js";
import { AppError, BadRequestError } from "../../errors/appError.js";
import { emit } from "../../realtime/events.js";
import { emailConfigured, escapeHtml, sendEmail } from "../../utils/email.js";
import * as settingsService from "../settings/settings.service.js";

// Envío del boletín desde el admin: plantilla, enlace de baja firmado y envío en segundo plano.

const storeUrl = () => (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

// Pausa entre correos: Resend limita las peticiones por segundo.
export const SEND_DELAY_MS = Number(process.env.NEWSLETTER_SEND_DELAY_MS ?? 600);

// ==================== Enlace de baja ====================

const unsubscribeSecret = () => {
  const secret = process.env.CREDENTIALS_KEY?.trim() || process.env.JWT_SECRET?.trim();
  if (!secret) throw new AppError("Falta JWT_SECRET en el backend", 500);
  return secret;
};

/** Firma del enlace de baja: sin ella nadie puede dar de baja a otro cambiando el id en la URL. */
export const unsubscribeToken = (subscriberId: string) =>
  createHmac("sha256", unsubscribeSecret()).update(`newsletter-baja:${subscriberId}`).digest("base64url").slice(0, 32);

export const unsubscribeUrl = (subscriberId: string) =>
  `${storeUrl()}/boletin/baja?id=${encodeURIComponent(subscriberId)}&t=${unsubscribeToken(subscriberId)}`;

/** Baja desde el enlace del correo. Responde igual si ya estaba de baja. */
export const unsubscribe = async (id: unknown, token: unknown) => {
  if (typeof id !== "string" || typeof token !== "string" || !id || !token) throw new BadRequestError("Enlace de baja inválido");
  const expected = Buffer.from(unsubscribeToken(id));
  const given = Buffer.from(token);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw new BadRequestError("Enlace de baja inválido");

  const subscriber = await getPrisma().subscriber.findUnique({ where: { id } });
  if (!subscriber) throw new BadRequestError("Enlace de baja inválido");
  if (subscriber.activo) await getPrisma().subscriber.update({ where: { id }, data: { activo: false } });
  emit("subscribers", "updated");
  return { email: subscriber.email };
};

// ==================== Plantilla ====================

export interface CampaignInput {
  asunto: string;
  mensaje: string;
  botonTexto: string | null;
  botonUrl: string | null;
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Valida lo que escribe el admin. El botón es opcional, pero si tiene texto necesita un enlace http(s). */
export function parseCampaign(body: Record<string, unknown>): CampaignInput {
  const asunto = text(body.asunto, 150);
  const mensaje = text(body.mensaje, 10000);
  const botonTexto = text(body.botonTexto, 60) || null;
  const botonUrl = text(body.botonUrl, 500) || null;
  if (!asunto) throw new BadRequestError("Escribe el asunto del correo");
  if (!mensaje) throw new BadRequestError("Escribe el mensaje del correo");
  if (botonTexto && !botonUrl) throw new BadRequestError("Agrega el enlace del botón o quita su texto");
  if (botonUrl && !/^https?:\/\/\S+$/i.test(botonUrl)) throw new BadRequestError("El enlace del botón debe empezar con http:// o https://");
  return { asunto, mensaje, botonTexto: botonUrl ? botonTexto || "Ver más" : null, botonUrl };
}

const linkify = (escaped: string) =>
  escaped.replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" style="color:#05c48a">${url}</a>`);

/** HTML y texto del correo. `bajaUrl` se reemplaza por el enlace de cada suscriptor. */
export function renderCampaign(input: CampaignInput, opts: { marca: string; nombre?: string; bajaUrl: string }) {
  const saludo = opts.nombre ? `Hola ${opts.nombre.split(/\s+/)[0]},` : "Hola,";
  const paragraphs = input.mensaje
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${linkify(escapeHtml(p)).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const button = input.botonUrl
    ? `<p style="margin:24px 0"><a href="${escapeHtml(input.botonUrl)}" style="display:inline-block;background:#05c48a;color:#04110d;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px">${escapeHtml(input.botonTexto ?? "Ver más")}</a></p>`
    : "";
  const marca = escapeHtml(opts.marca);

  const html = `<!doctype html><html><body style="margin:0;background:#f3f6f5;font-family:Arial,Helvetica,sans-serif;color:#0b1a16">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0b1a16;padding:18px 24px;color:#05c48a;font-size:20px;font-weight:800">${marca}</td></tr>
<tr><td style="padding:28px 24px 8px;font-size:15px">
<p style="margin:0 0 16px;font-weight:700">${escapeHtml(saludo)}</p>
${paragraphs}${button}
</td></tr>
<tr><td style="padding:16px 24px 24px;border-top:1px solid #e3ebe8;font-size:12px;color:#6b7c77;line-height:1.5">
Recibes este correo porque te suscribiste al boletín de ${marca}.<br>
<a href="${escapeHtml(opts.bajaUrl)}" style="color:#6b7c77">Darse de baja</a>
</td></tr></table></td></tr></table></body></html>`;

  const plain = [
    saludo,
    "",
    input.mensaje,
    ...(input.botonUrl ? ["", `${input.botonTexto ?? "Ver más"}: ${input.botonUrl}`] : []),
    "",
    "—",
    `Recibes este correo porque te suscribiste al boletín de ${opts.marca}.`,
    `Darse de baja: ${opts.bajaUrl}`,
  ].join("\n");

  return { html, text: plain };
}

const brandName = async () => (await settingsService.get()).marca.nombre || "Tienda";

export const preview = async (body: Record<string, unknown>) => {
  const input = parseCampaign(body);
  return renderCampaign(input, { marca: await brandName(), nombre: "María", bajaUrl: `${storeUrl()}/boletin/baja` }).html;
};

const ensureEmail = () => {
  if (!emailConfigured()) {
    throw new AppError("El envío de correos no está configurado. Agrega RESEND_API_KEY y EMAIL_FROM en el backend (Railway → Variables).", 503);
  }
};

/** Correo de prueba a una dirección (normalmente la del admin), sin guardar campaña. */
export const sendTest = async (body: Record<string, unknown>) => {
  ensureEmail();
  const input = parseCampaign(body);
  const to = text(body.to, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) throw new BadRequestError("Escribe un correo válido para la prueba");
  const { html, text: plain } = renderCampaign(input, { marca: await brandName(), bajaUrl: `${storeUrl()}/boletin/baja` });
  await sendEmail({ to, subject: `[Prueba] ${input.asunto}`, html, text: plain });
  return { message: `Prueba enviada a ${to}` };
};

// ==================== Envío ====================

// Una campaña a la vez, en este proceso. Si el servidor se reinicia a mitad, queda como INTERRUMPIDA.
let activeCampaignId: string | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const listCampaigns = async () => {
  const campaigns = await getPrisma().newsletterCampaign.findMany({ orderBy: { creadoEn: "desc" }, take: 50 });
  const stale = campaigns.filter((c) => c.estado === "ENVIANDO" && c.id !== activeCampaignId);
  for (const c of stale) {
    await getPrisma().newsletterCampaign.update({ where: { id: c.id }, data: { estado: "INTERRUMPIDA", terminadoEn: new Date() } });
    c.estado = "INTERRUMPIDA";
  }
  return { campaigns, enviando: activeCampaignId !== null, correoConfigurado: emailConfigured() };
};

/** Crea la campaña y la envía en segundo plano a los suscriptores activos. Responde enseguida. */
export const startCampaign = async (body: Record<string, unknown>) => {
  ensureEmail();
  if (activeCampaignId) throw new AppError("Ya se está enviando un boletín. Espera a que termine.", 409);
  const input = parseCampaign(body);

  const recipients = await getPrisma().subscriber.findMany({ where: { activo: true }, orderBy: { creadoEn: "asc" } });
  if (recipients.length === 0) throw new BadRequestError("No hay suscriptores activos a quienes enviar");

  const campaign = await getPrisma().newsletterCampaign.create({ data: { ...input, total: recipients.length } });
  activeCampaignId = campaign.id;
  emit("subscribers", "created");

  void runCampaign(campaign.id, input, recipients);
  return campaign;
};

export async function runCampaign(campaignId: string, input: CampaignInput, recipients: { id: string; nombre: string; email: string }[]) {
  let enviados = 0;
  let fallidos = 0;
  try {
    const marca = await brandName();
    for (const [i, s] of recipients.entries()) {
      const bajaUrl = unsubscribeUrl(s.id);
      const { html, text: plain } = renderCampaign(input, { marca, nombre: s.nombre, bajaUrl });
      try {
        await sendEmail({ to: s.email, subject: input.asunto, html, text: plain, headers: { "List-Unsubscribe": `<${bajaUrl}>` } });
        enviados++;
      } catch {
        fallidos++;
      }
      // Progreso visible en el admin cada 10 correos
      if ((i + 1) % 10 === 0) {
        await getPrisma().newsletterCampaign.update({ where: { id: campaignId }, data: { enviados, fallidos } });
        emit("subscribers", "updated");
      }
      if (i < recipients.length - 1 && SEND_DELAY_MS > 0) await sleep(SEND_DELAY_MS);
    }
    await getPrisma().newsletterCampaign.update({
      where: { id: campaignId },
      data: { enviados, fallidos, estado: fallidos > 0 ? "CON_ERRORES" : "ENVIADA", terminadoEn: new Date() },
    });
  } catch (err) {
    console.error("[newsletter] Envío interrumpido:", (err as Error).message);
    await getPrisma()
      .newsletterCampaign.update({ where: { id: campaignId }, data: { enviados, fallidos, estado: "INTERRUMPIDA", terminadoEn: new Date() } })
      .catch(() => {});
  } finally {
    activeCampaignId = null;
    emit("subscribers", "updated");
  }
}
