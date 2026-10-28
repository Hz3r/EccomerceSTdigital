import { createHmac, timingSafeEqual } from "crypto";
import { AppError } from "../../../errors/appError.js";

// Izipay (Perú) usa la plataforma REST V4 de Lyra: el backend crea un "formToken" y la tienda
// muestra el formulario incrustado de Izipay con ese token. La tarjeta nunca pasa por nuestro servidor.
// Claves en el Back Office Vendedor de Izipay → Configuración → Tienda → Claves de API REST.

export interface IzipayConfig {
  username: string;
  password: string;
  publicKey: string;
  hmacKey: string;
  endpoint: string;
}

export function izipayConfig(): IzipayConfig | null {
  const username = process.env.IZIPAY_USERNAME?.trim();
  const password = process.env.IZIPAY_PASSWORD?.trim();
  const publicKey = process.env.IZIPAY_PUBLIC_KEY?.trim();
  const hmacKey = process.env.IZIPAY_HMAC_KEY?.trim();
  if (!username || !password || !publicKey || !hmacKey) return null;
  return { username, password, publicKey, hmacKey, endpoint: process.env.IZIPAY_ENDPOINT?.trim() || "https://api.micuentaweb.pe" };
}

/** Script del formulario de Izipay que carga la tienda. */
export const IZIPAY_SCRIPT_URL =
  process.env.IZIPAY_SCRIPT_URL?.trim() || "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js";

export async function createFormToken(
  config: IzipayConfig,
  input: { amountCents: number; orderId: string; email: string; paymentId: string }
): Promise<string> {
  const auth = Buffer.from(`${config.username}:${config.password}`).toString("base64");
  const res = await fetch(`${config.endpoint}/api-payment/V4/Charge/CreatePayment`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: "PEN",
      orderId: input.orderId,
      customer: { email: input.email },
      metadata: { paymentId: input.paymentId },
    }),
  }).catch(() => null);

  const body = (await res?.json().catch(() => null)) as { status?: string; answer?: { formToken?: string; errorMessage?: string } } | null;
  if (!res?.ok || body?.status !== "SUCCESS" || !body.answer?.formToken) {
    console.error("[izipay] CreatePayment falló:", body?.answer?.errorMessage ?? res?.status);
    throw new AppError("No se pudo iniciar el pago con tarjeta. Intenta de nuevo o usa otro método.", 502);
  }
  return body.answer.formToken;
}

/**
 * Firma de Izipay: HMAC-SHA256 (hex) de `kr-answer`.
 * Para la IPN (servidor a servidor) se usa la contraseña de la API REST; para el retorno del navegador, la clave HMAC.
 */
export function isValidKrHash(krAnswer: string, krHash: string, secret: string) {
  const expected = createHmac("sha256", secret).update(krAnswer, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(krHash.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface IzipayAnswer {
  orderStatus?: string;
  orderDetails?: { orderId?: string; orderTotalAmount?: number; orderCurrency?: string; metadata?: Record<string, string> };
  transactions?: { uuid?: string; status?: string; detailedStatus?: string }[];
}

/** Lee `kr-answer` y devuelve lo necesario para conciliar el pago. */
export function parseAnswer(krAnswer: string) {
  const answer = JSON.parse(krAnswer) as IzipayAnswer;
  return {
    paid: answer.orderStatus === "PAID",
    orderId: answer.orderDetails?.orderId,
    paymentId: answer.orderDetails?.metadata?.paymentId,
    amountCents: answer.orderDetails?.orderTotalAmount,
    currency: answer.orderDetails?.orderCurrency,
    transactionId: answer.transactions?.[0]?.uuid,
    status: answer.transactions?.[0]?.detailedStatus ?? answer.orderStatus,
  };
}
