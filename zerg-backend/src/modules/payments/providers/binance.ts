import { createHmac, createPublicKey, createVerify, randomBytes, type KeyObject } from "crypto";
import { AppError } from "../../../errors/appError.js";

// Binance Pay Merchant: el backend crea una orden (en USDT) y el cliente paga desde la app de Binance
// (QR o enlace). Binance avisa el resultado a nuestro webhook firmado con RSA.
// Requiere una cuenta de comercio en Binance Pay (merchant.binance.com) con API Key y Secret.

export interface BinanceConfig {
  apiKey: string;
  secret: string;
  endpoint: string;
}

export function binanceConfig(): BinanceConfig | null {
  const apiKey = process.env.BINANCE_PAY_API_KEY?.trim();
  const secret = process.env.BINANCE_PAY_SECRET?.trim();
  if (!apiKey || !secret) return null;
  return { apiKey, secret, endpoint: process.env.BINANCE_PAY_ENDPOINT?.trim() || "https://bpay.binanceapi.com" };
}

/** Firma de las peticiones a Binance Pay: HMAC-SHA512 de "timestamp\nnonce\nbody\n", en hexadecimal mayúscula. */
export function signRequest(secret: string, timestamp: string, nonce: string, body: string) {
  return createHmac("sha512", secret).update(`${timestamp}\n${nonce}\n${body}\n`).digest("hex").toUpperCase();
}

const nonce = () => randomBytes(16).toString("hex"); // 32 caracteres

async function call<T>(config: BinanceConfig, path: string, payload: unknown): Promise<T> {
  const body = JSON.stringify(payload);
  const timestamp = Date.now().toString();
  const n = nonce();
  const res = await fetch(`${config.endpoint}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": timestamp,
      "BinancePay-Nonce": n,
      "BinancePay-Certificate-SN": config.apiKey,
      "BinancePay-Signature": signRequest(config.secret, timestamp, n, body),
    },
    body,
  }).catch(() => null);
  const json = (await res?.json().catch(() => null)) as { status?: string; data?: T; errorMessage?: string } | null;
  if (!res?.ok || json?.status !== "SUCCESS" || !json.data) {
    console.error(`[binance-pay] ${path} falló:`, json?.errorMessage ?? res?.status);
    throw new AppError("No se pudo iniciar el pago con Binance Pay. Intenta de nuevo o usa otro método.", 502);
  }
  return json.data;
}

export interface BinanceOrder {
  prepayId: string;
  checkoutUrl: string;
  qrcodeLink?: string;
  qrContent?: string;
  deeplink?: string;
  universalUrl?: string;
  expireTime?: number;
}

export function createOrder(
  config: BinanceConfig,
  input: { merchantTradeNo: string; amountUsdt: number; description: string; returnUrl: string; webhookUrl?: string }
) {
  return call<BinanceOrder>(config, "/binancepay/openapi/v3/order", {
    env: { terminalType: "WEB" },
    merchantTradeNo: input.merchantTradeNo,
    orderAmount: input.amountUsdt,
    currency: "USDT",
    description: input.description.slice(0, 256),
    goodsDetails: [
      { goodsType: "02", goodsCategory: "Z000", referenceGoodsId: input.merchantTradeNo, goodsName: input.description.slice(0, 256) },
    ],
    returnUrl: input.returnUrl,
    cancelUrl: input.returnUrl,
    ...(input.webhookUrl && { webhookUrl: input.webhookUrl }),
  });
}

// Certificados públicos de Binance para verificar webhooks (se piden una vez y se guardan en memoria).
let certificates: Map<string, KeyObject> | null = null;

async function getCertificates(config: BinanceConfig, refresh = false) {
  if (certificates && !refresh) return certificates;
  const list = await call<{ certPublic: string; certSerial: string }[]>(config, "/binancepay/openapi/certificates", {});
  certificates = new Map(list.map((c) => [c.certSerial, createPublicKey(c.certPublic)]));
  return certificates;
}

/** Verifica la firma RSA-SHA256 de un webhook: "timestamp\nnonce\nbody\n" con el certificado indicado. */
export function isValidWebhookSignature(publicKey: KeyObject, timestamp: string, nonceValue: string, rawBody: string, signature: string) {
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${timestamp}\n${nonceValue}\n${rawBody}\n`);
  return verifier.verify(publicKey, Buffer.from(signature, "base64"));
}

export async function verifyWebhook(config: BinanceConfig, headers: Record<string, string | undefined>, rawBody: string) {
  const serial = headers["binancepay-certificate-sn"];
  const timestamp = headers["binancepay-timestamp"];
  const nonceValue = headers["binancepay-nonce"];
  const signature = headers["binancepay-signature"];
  if (!serial || !timestamp || !nonceValue || !signature) return false;

  let key = (await getCertificates(config)).get(serial);
  if (!key) key = (await getCertificates(config, true)).get(serial);
  return Boolean(key && isValidWebhookSignature(key, timestamp, nonceValue, rawBody, signature));
}

export interface BinanceWebhook {
  bizType?: string;
  bizStatus?: string;
  data?: string;
}

/** El campo `data` del webhook es JSON en texto con el detalle de la orden. */
export function parseWebhook(rawBody: string) {
  const event = JSON.parse(rawBody) as BinanceWebhook;
  const data = event.data ? (JSON.parse(event.data) as { merchantTradeNo?: string; totalFee?: number | string; currency?: string; transactionId?: string }) : {};
  return {
    isPayment: event.bizType === "PAY",
    status: event.bizStatus,
    paid: event.bizStatus === "PAY_SUCCESS",
    merchantTradeNo: data.merchantTradeNo,
    totalFee: data.totalFee === undefined ? undefined : Number(data.totalFee),
    currency: data.currency,
    transactionId: data.transactionId,
  };
}
