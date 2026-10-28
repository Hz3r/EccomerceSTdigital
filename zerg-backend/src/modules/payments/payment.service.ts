import { unlink } from "fs/promises";
import type { MetodoPago, Payment, Prisma } from "@prisma/client";
import { getPrisma } from "../../config/database.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../errors/appError.js";
import { emit } from "../../realtime/events.js";
import type { TokenPayload } from "../../utils/token.js";
import { notifyAdmins, notifyUser } from "../notifications/notification.service.js";
import * as settingsService from "../settings/settings.service.js";
import * as izipay from "./providers/izipay.js";
import * as binance from "./providers/binance.js";
import { proofPath } from "./payment.storage.js";

const METODOS: MetodoPago[] = ["DIRECTO", "IZIPAY", "BINANCE_PAY"];
const LABEL: Record<MetodoPago, string> = { DIRECTO: "Yape, Plin o transferencia", IZIPAY: "Tarjeta (Izipay)", BINANCE_PAY: "Binance Pay" };

const money = (value: unknown) => `S/ ${Number(value).toFixed(2)}`;
const storeUrl = () => (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const backendUrl = () => process.env.BACKEND_PUBLIC_URL?.trim().replace(/\/$/, "");

export const parseMetodo = (value: unknown): MetodoPago | undefined =>
  typeof value === "string" && (METODOS as string[]).includes(value) ? (value as MetodoPago) : undefined;

/** Métodos que la tienda puede ofrecer ahora (los que no están configurados se muestran como "próximamente"). */
export async function availableMethods() {
  const settings = await settingsService.get();
  return METODOS.map((metodo) => ({
    metodo,
    label: LABEL[metodo],
    disponible:
      metodo === "DIRECTO" ? settings.pagos.directo.activo : metodo === "IZIPAY" ? Boolean(izipay.izipayConfig()) : Boolean(binance.binanceConfig()),
  }));
}

export async function assertAvailable(metodo: MetodoPago) {
  const method = (await availableMethods()).find((m) => m.metodo === metodo);
  if (!method?.disponible) throw new BadRequestError(`${LABEL[metodo]} no está disponible por ahora. Elige otro método.`);
}

const paymentSelect = {
  id: true,
  metodo: true,
  estado: true,
  monto: true,
  moneda: true,
  referencia: true,
  motivoRechazo: true,
  comprobante: true,
  creadoEn: true,
  actualizado: true,
} as const;

// El comprobante es un nombre de archivo interno: hacia fuera solo se indica si existe.
function publicPayment<T extends { comprobante?: string | null }>(payment: T) {
  const { comprobante, ...rest } = payment;
  return { ...rest, tieneComprobante: Boolean(comprobante) };
}

async function findOwnedPayment(viewer: TokenPayload, paymentId: string) {
  const payment = await getPrisma().payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment || (viewer.rol !== "ADMIN" && payment.order.userId !== viewer.userId)) {
    throw new NotFoundError("Pago no encontrado");
  }
  return payment;
}

/** Pedido con su pago actual, para la página "Pagar pedido" (solo su dueño o un admin). */
export async function getOrderPayment(viewer: TokenPayload, numeroOrden: string) {
  const order = await getPrisma().order.findUnique({
    where: { numeroOrden },
    include: {
      items: { include: { plan: { select: { nombre: true, duracion: true, product: { select: { nombre: true, slug: true } } } } } },
      payments: { select: paymentSelect, orderBy: { creadoEn: "desc" }, take: 1 },
    },
  });
  if (!order || (viewer.rol !== "ADMIN" && order.userId !== viewer.userId)) {
    throw new NotFoundError("Pedido no encontrado");
  }
  const { payments, ...rest } = order;
  return { ...rest, payment: payments[0] ? publicPayment(payments[0]) : null, methods: await availableMethods() };
}

/** Crea el pago pendiente de una orden recién creada (o al cambiar de método). */
export function createPending(orderId: string, metodo: MetodoPago, monto: Prisma.Decimal | number) {
  return getPrisma().payment.create({ data: { orderId, metodo, monto } });
}

/** El cliente cambia de método mientras el pedido no está pagado ni en revisión. */
export async function changeMethod(viewer: TokenPayload, numeroOrden: string, metodo: MetodoPago) {
  await assertAvailable(metodo);
  const order = await getOrderPayment(viewer, numeroOrden);
  if (order.status === "CANCELADO") throw new BadRequestError("Este pedido fue cancelado");
  if (order.payment && ["PAGADO", "EN_REVISION"].includes(order.payment.estado)) {
    throw new ConflictError(order.payment.estado === "PAGADO" ? "Este pedido ya está pagado" : "Tu comprobante está en revisión");
  }
  if (order.payment?.metodo === metodo && order.payment.estado === "PENDIENTE") return order;

  await getPrisma().$transaction([
    getPrisma().payment.create({ data: { orderId: order.id, metodo, monto: order.total } }),
    getPrisma().order.update({ where: { id: order.id }, data: { metodoPago: metodo } }),
  ]);
  emit("orders");
  return getOrderPayment(viewer, numeroOrden);
}

// ==================== PAGO DIRECTO (Yape / Plin / transferencia) ====================

// Por dónde pagó el cliente (lo elige en la tienda); ayuda al admin a buscar el abono.
const MEDIOS = ["Yape", "Plin", "Transferencia"] as const;

export async function submitProof(
  viewer: TokenPayload,
  paymentId: string,
  input: { referencia?: unknown; medio?: unknown; file?: Express.Multer.File }
) {
  const discard = () => input.file && unlink(input.file.path).catch(() => {});
  try {
    const payment = await findOwnedPayment(viewer, paymentId);
    if (payment.metodo !== "DIRECTO") throw new BadRequestError("Este pago no es por transferencia");
    if (!["PENDIENTE", "RECHAZADO"].includes(payment.estado)) {
      throw new ConflictError(payment.estado === "PAGADO" ? "Este pedido ya está pagado" : "Tu comprobante ya está en revisión");
    }
    const referencia = typeof input.referencia === "string" ? input.referencia.trim().slice(0, 60) : "";
    // La captura basta: en el celular copiar el n.º de operación es engorroso y la captura ya lo muestra.
    if (!input.file) throw new BadRequestError("Sube la captura de tu pago");
    const medio = MEDIOS.find((m) => m === input.medio);

    if (payment.comprobante) await unlink(proofPath(payment.comprobante)).catch(() => {});
    const updated = await getPrisma().payment.update({
      where: { id: payment.id },
      data: {
        estado: "EN_REVISION",
        referencia: referencia || null,
        comprobante: input.file.filename,
        motivoRechazo: null,
        ...(medio && { detalle: { medio } }),
      },
      select: paymentSelect,
    });

    await notifyAdmins({
      tipo: "PAGO",
      titulo: "Comprobante por revisar",
      mensaje: [payment.order.numeroOrden, payment.order.nombreCliente, money(payment.monto), medio, referencia && `Op. ${referencia}`].filter(Boolean).join(" · "),
      href: `/orders?q=${payment.order.numeroOrden}`,
      orderId: payment.orderId,
    });
    emit("orders");
    return publicPayment(updated);
  } catch (err) {
    await discard();
    throw err;
  }
}

/** Ruta del archivo del comprobante, solo para el dueño del pedido o un admin. */
export async function getProof(viewer: TokenPayload, paymentId: string) {
  const payment = await findOwnedPayment(viewer, paymentId);
  if (!payment.comprobante) throw new NotFoundError("Este pago no tiene comprobante");
  return proofPath(payment.comprobante);
}

/** El admin confirma o rechaza un pago directo. */
export async function review(paymentId: string, input: { aprobar: unknown; motivo?: unknown }) {
  const payment = await getPrisma().payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment) throw new NotFoundError("Pago no encontrado");
  if (payment.estado === "PAGADO") throw new ConflictError("Este pago ya está confirmado");

  if (input.aprobar === true) {
    return publicPayment(await markPaid(payment, { origen: "Confirmado por el admin" }));
  }

  const motivo = typeof input.motivo === "string" && input.motivo.trim() ? input.motivo.trim().slice(0, 200) : "No pudimos verificar el pago.";
  const updated = await getPrisma().payment.update({
    where: { id: payment.id },
    data: { estado: "RECHAZADO", motivoRechazo: motivo },
    select: paymentSelect,
  });
  if (payment.order.userId) {
    await notifyUser(payment.order.userId, {
      tipo: "PAGO",
      titulo: "Revisa tu pago",
      mensaje: `No pudimos confirmar el pago de ${payment.order.numeroOrden}: ${motivo} Puedes subir otro comprobante.`,
      href: `/pago/${payment.order.numeroOrden}`,
      orderId: payment.orderId,
    });
  }
  emit("orders");
  return publicPayment(updated);
}

// Deja el pago como PAGADO una sola vez (los webhooks pueden repetirse) y avisa al cliente y al admin.
async function markPaid(payment: Payment & { order: { id: string; numeroOrden: string; nombreCliente: string; userId: string | null } }, info: { referencia?: string; origen: string; detalle?: Prisma.InputJsonValue }) {
  if (payment.estado === "PAGADO") return getPrisma().payment.findUniqueOrThrow({ where: { id: payment.id }, select: paymentSelect });

  const updated = await getPrisma().payment.update({
    where: { id: payment.id },
    data: {
      estado: "PAGADO",
      motivoRechazo: null,
      ...(info.referencia && { referencia: info.referencia }),
      ...(info.detalle !== undefined && { detalle: info.detalle }),
    },
    select: paymentSelect,
  });

  if (payment.order.userId) {
    await notifyUser(payment.order.userId, {
      tipo: "PAGO",
      titulo: "Pago confirmado",
      mensaje: `Recibimos el pago de tu pedido ${payment.order.numeroOrden}. Ya estamos preparando tus accesos.`,
      href: `/account?orden=${payment.order.numeroOrden}`,
      orderId: payment.orderId,
    });
  }
  await notifyAdmins({
    tipo: "PAGO",
    titulo: "Pago recibido",
    mensaje: `${payment.order.numeroOrden} · ${payment.order.nombreCliente} · ${money(payment.monto)} · ${LABEL[payment.metodo]} (${info.origen})`,
    href: `/orders?q=${payment.order.numeroOrden}`,
    orderId: payment.orderId,
  });
  emit("orders");
  return updated;
}

function assertPayable(payment: Payment & { order: { status: string } }, metodo: MetodoPago) {
  if (payment.metodo !== metodo) throw new BadRequestError("Este pago usa otro método");
  if (payment.estado === "PAGADO") throw new ConflictError("Este pedido ya está pagado");
  if (payment.order.status === "CANCELADO") throw new BadRequestError("Este pedido fue cancelado");
}

// ==================== IZIPAY (tarjetas) ====================

export async function startIzipay(viewer: TokenPayload, paymentId: string) {
  const config = izipay.izipayConfig();
  if (!config) throw new BadRequestError("El pago con tarjeta no está disponible por ahora");
  const payment = await findOwnedPayment(viewer, paymentId);
  assertPayable(payment, "IZIPAY");

  const formToken = await izipay.createFormToken(config, {
    amountCents: Math.round(Number(payment.monto) * 100),
    orderId: payment.order.numeroOrden,
    email: payment.order.email,
    paymentId: payment.id,
  });
  return { formToken, publicKey: config.publicKey, scriptUrl: izipay.IZIPAY_SCRIPT_URL };
}

async function settleIzipay(answer: ReturnType<typeof izipay.parseAnswer>, origen: string) {
  if (!answer.paid) return null;
  const payment = answer.paymentId
    ? await getPrisma().payment.findUnique({ where: { id: answer.paymentId }, include: { order: true } })
    : null;
  if (!payment || payment.metodo !== "IZIPAY" || payment.order.numeroOrden !== answer.orderId) {
    console.error("[izipay] Pago no encontrado para la orden", answer.orderId);
    return null;
  }
  // El monto cobrado debe coincidir con el del pedido
  if (answer.currency !== "PEN" || answer.amountCents !== Math.round(Number(payment.monto) * 100)) {
    console.error("[izipay] El monto no coincide en", answer.orderId, answer.amountCents, answer.currency);
    return null;
  }
  return markPaid(payment, {
    referencia: answer.transactionId,
    origen,
    detalle: { proveedor: "izipay", transaccion: answer.transactionId ?? null, estado: answer.status ?? null },
  });
}

/** IPN de Izipay (servidor a servidor). Es la confirmación definitiva del pago. */
export async function handleIzipayIpn(rawBody: string) {
  const config = izipay.izipayConfig();
  if (!config) throw new BadRequestError("Izipay no está configurado");
  const form = new URLSearchParams(rawBody);
  const krAnswer = form.get("kr-answer");
  const krHash = form.get("kr-hash");
  if (!krAnswer || !krHash || !izipay.isValidKrHash(krAnswer, krHash, config.password)) {
    throw new BadRequestError("Firma de Izipay inválida");
  }
  await settleIzipay(izipay.parseAnswer(krAnswer), "Izipay");
}

/** Retorno del formulario en el navegador: confirma al instante (la IPN llega igual y no duplica). */
export async function confirmIzipayReturn(viewer: TokenPayload, paymentId: string, input: { krAnswer?: unknown; krHash?: unknown }) {
  const config = izipay.izipayConfig();
  if (!config) throw new BadRequestError("Izipay no está configurado");
  await findOwnedPayment(viewer, paymentId);
  if (typeof input.krAnswer !== "string" || typeof input.krHash !== "string" || !izipay.isValidKrHash(input.krAnswer, input.krHash, config.hmacKey)) {
    throw new BadRequestError("No pudimos validar la respuesta del pago");
  }
  const answer = izipay.parseAnswer(input.krAnswer);
  if (answer.paymentId !== paymentId) throw new BadRequestError("La respuesta no corresponde a este pago");
  await settleIzipay(answer, "Izipay");
  return publicPayment(await getPrisma().payment.findUniqueOrThrow({ where: { id: paymentId }, select: paymentSelect }));
}

// ==================== BINANCE PAY (cripto) ====================

// merchantTradeNo: solo letras y números, máximo 32 → el uuid del pago sin guiones.
const tradeNo = (paymentId: string) => paymentId.replace(/-/g, "");
const paymentIdFromTradeNo = (value: string) =>
  /^[0-9a-f]{32}$/i.test(value) ? `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}` : null;

export async function startBinance(viewer: TokenPayload, paymentId: string) {
  const config = binance.binanceConfig();
  if (!config) throw new BadRequestError("Binance Pay no está disponible por ahora");
  const payment = await findOwnedPayment(viewer, paymentId);
  assertPayable(payment, "BINANCE_PAY");

  const { pagos } = await settingsService.get();
  const tipoCambio = pagos.tipoCambioUsdt > 0 ? pagos.tipoCambioUsdt : 3.75;
  const montoUsdt = Math.max(0.01, Math.round((Number(payment.monto) / tipoCambio) * 100) / 100);
  const webhook = backendUrl();

  const order = await binance.createOrder(config, {
    merchantTradeNo: tradeNo(payment.id),
    amountUsdt: montoUsdt,
    description: `Pedido ${payment.order.numeroOrden}`,
    returnUrl: `${storeUrl()}/pago/${payment.order.numeroOrden}`,
    ...(webhook && { webhookUrl: `${webhook}/api/payments/webhooks/binance` }),
  });

  await getPrisma().payment.update({
    where: { id: payment.id },
    data: { detalle: { proveedor: "binance", prepayId: order.prepayId, montoUsdt, tipoCambio } },
  });
  return { checkoutUrl: order.checkoutUrl, qrcodeLink: order.qrcodeLink ?? null, universalUrl: order.universalUrl ?? null, expireTime: order.expireTime ?? null, montoUsdt, tipoCambio };
}

/** Webhook de Binance Pay. Debe responder { returnCode: "SUCCESS" } para que Binance no reintente. */
export async function handleBinanceWebhook(headers: Record<string, string | undefined>, rawBody: string) {
  const config = binance.binanceConfig();
  if (!config) throw new BadRequestError("Binance Pay no está configurado");
  if (!(await binance.verifyWebhook(config, headers, rawBody))) throw new BadRequestError("Firma de Binance Pay inválida");

  const event = binance.parseWebhook(rawBody);
  if (event.isPayment && event.paid && event.merchantTradeNo) {
    const id = paymentIdFromTradeNo(event.merchantTradeNo);
    const payment = id ? await getPrisma().payment.findUnique({ where: { id }, include: { order: true } }) : null;
    const expected = Number((payment?.detalle as { montoUsdt?: number } | null)?.montoUsdt);
    if (!payment || payment.metodo !== "BINANCE_PAY") {
      console.error("[binance-pay] Pago no encontrado:", event.merchantTradeNo);
    } else if (event.totalFee === undefined || Math.abs(event.totalFee - expected) > 0.001) {
      console.error("[binance-pay] El monto no coincide en", event.merchantTradeNo, event.totalFee, expected);
    } else {
      await markPaid(payment, {
        referencia: event.transactionId,
        origen: "Binance Pay",
        detalle: { ...(payment.detalle as object), transaccion: event.transactionId ?? null, estado: event.status ?? null },
      });
    }
  }
  return { returnCode: "SUCCESS", returnMessage: null };
}
