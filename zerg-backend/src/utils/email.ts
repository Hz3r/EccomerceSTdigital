import { AppError } from "../errors/appError.js";

// Correo transaccional con Resend (resend.com): solo una API key y un remitente de un dominio verificado.
// RESEND_API_KEY=re_…  EMAIL_FROM="ZERG <accesos@tudominio.com>"

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());

export async function sendEmail(input: { to: string; subject: string; html: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new AppError("El correo no está configurado. Completa RESEND_API_KEY y EMAIL_FROM en el backend.", 503);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
  }).catch(() => null);

  const body = (await res?.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!res?.ok || !body?.id) {
    console.error("[email] Envío fallido:", body?.message ?? res?.status);
    throw new AppError(`No se pudo enviar el correo${body?.message ? `: ${body.message}` : ""}.`, 502);
  }
  return body.id;
}

export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
