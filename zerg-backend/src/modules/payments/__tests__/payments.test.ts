import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac, createSign, generateKeyPairSync } from "crypto";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import * as izipay from "../providers/izipay.js";
import * as binance from "../providers/binance.js";
import * as paymentService from "../payment.service.js";

const client = { userId: "cliente-1", email: "c@test.com", rol: "CLIENTE" as const };
const order = { id: "order-1", numeroOrden: "ORD-1", nombreCliente: "Ana", email: "ana@test.com", userId: "cliente-1", status: "PENDIENTE", total: 24.9 };
const payment = (patch: Record<string, unknown> = {}) => ({
  id: "11111111-2222-3333-4444-555555555555",
  orderId: order.id,
  metodo: "DIRECTO",
  estado: "PENDIENTE",
  monto: 24.9,
  moneda: "PEN",
  referencia: null,
  comprobante: null,
  motivoRechazo: null,
  detalle: null,
  order,
  ...patch,
});
const notified = () => mockPrisma.notification.create.mock.calls.map(([arg]) => arg.data);

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.siteSetting.findUnique.mockResolvedValue(null);
  mockPrisma.payment.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...payment(), ...data }));
});

afterEach(() => {
  delete process.env.IZIPAY_USERNAME;
  delete process.env.IZIPAY_PASSWORD;
  delete process.env.IZIPAY_PUBLIC_KEY;
  delete process.env.IZIPAY_HMAC_KEY;
  delete process.env.BINANCE_PAY_API_KEY;
  delete process.env.BINANCE_PAY_SECRET;
  vi.unstubAllGlobals();
});

describe("métodos disponibles", () => {
  it("el pago directo está activo por defecto; Izipay y Binance solo con credenciales", async () => {
    const methods = await paymentService.availableMethods();
    expect(methods.map((m) => [m.metodo, m.disponible])).toEqual([
      ["DIRECTO", true],
      ["IZIPAY", false],
      ["BINANCE_PAY", false],
    ]);
  });

  it("no deja crear una orden con un método no configurado", async () => {
    await expect(paymentService.assertAvailable("IZIPAY")).rejects.toThrow("no está disponible");
  });
});

describe("pago directo", () => {
  const file = { filename: "abc.png", path: "/tmp/no-existe.png" } as Express.Multer.File;

  it("el cliente sube su comprobante y queda en revisión, con aviso al admin", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(payment());
    const result = await paymentService.submitProof(client, payment().id, { referencia: " 123456 ", file });

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: "EN_REVISION", referencia: "123456", comprobante: "abc.png", motivoRechazo: null } })
    );
    expect(result).not.toHaveProperty("comprobante");
    expect(notified()).toEqual([expect.objectContaining({ audiencia: "ADMIN", tipo: "PAGO", titulo: "Comprobante por revisar" })]);
  });

  it("otro cliente no puede subir comprobantes a un pedido ajeno", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(payment({ order: { ...order, userId: "otro" } }));
    await expect(paymentService.submitProof(client, payment().id, { referencia: "1", file })).rejects.toThrow("Pago no encontrado");
  });

  it("exige la captura; el número de operación es opcional y se guarda el medio usado", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(payment());
    await expect(paymentService.submitProof(client, payment().id, { referencia: "1" })).rejects.toThrow("captura");

    await paymentService.submitProof(client, payment().id, { referencia: "", medio: "Yape", file });
    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: "EN_REVISION", referencia: null, comprobante: "abc.png", motivoRechazo: null, detalle: { medio: "Yape" } } })
    );
    expect(notified().at(-1)?.mensaje).toContain("Yape");
    expect(notified().at(-1)?.mensaje).not.toContain("Op.");
  });

  it("el admin confirma el pago y el cliente recibe el aviso", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(payment({ estado: "EN_REVISION" }));
    await paymentService.review(payment().id, { aprobar: true });

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estado: "PAGADO" }) }));
    expect(notified()).toEqual(
      expect.arrayContaining([expect.objectContaining({ audiencia: "CLIENTE", userId: "cliente-1", titulo: "Pago confirmado" })])
    );
  });

  it("el admin rechaza con motivo y el cliente puede volver a intentarlo", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(payment({ estado: "EN_REVISION" }));
    await paymentService.review(payment().id, { aprobar: false, motivo: "El monto no coincide." });

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: "RECHAZADO", motivoRechazo: "El monto no coincide." } })
    );
    expect(notified()).toEqual([expect.objectContaining({ audiencia: "CLIENTE", titulo: "Revisa tu pago", href: "/pago/ORD-1" })]);
  });
});

describe("Izipay", () => {
  const configure = () => {
    process.env.IZIPAY_USERNAME = "user";
    process.env.IZIPAY_PASSWORD = "testpassword_abc";
    process.env.IZIPAY_PUBLIC_KEY = "user:testpublickey";
    process.env.IZIPAY_HMAC_KEY = "hmac-key";
  };
  const answer = (patch: Record<string, unknown> = {}) =>
    JSON.stringify({
      orderStatus: "PAID",
      orderDetails: { orderId: "ORD-1", orderTotalAmount: 2490, orderCurrency: "PEN", metadata: { paymentId: payment().id } },
      transactions: [{ uuid: "tx-1", detailedStatus: "AUTHORISED" }],
      ...patch,
    });
  const ipnBody = (krAnswer: string, key = "testpassword_abc") =>
    new URLSearchParams({ "kr-answer": krAnswer, "kr-hash": createHmac("sha256", key).update(krAnswer).digest("hex"), "kr-hash-algorithm": "sha256_hmac" }).toString();

  it("valida kr-hash (HMAC-SHA256 en hexadecimal)", () => {
    const a = answer();
    expect(izipay.isValidKrHash(a, createHmac("sha256", "k").update(a).digest("hex"), "k")).toBe(true);
    expect(izipay.isValidKrHash(a, "00", "k")).toBe(false);
  });

  it("una IPN válida marca el pago como pagado", async () => {
    configure();
    mockPrisma.payment.findUnique.mockResolvedValue(payment({ metodo: "IZIPAY" }));
    await paymentService.handleIzipayIpn(ipnBody(answer()));

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: "PAGADO", referencia: "tx-1" }) })
    );
  });

  it("rechaza una IPN con firma falsa (o firmada con la clave HMAC del navegador)", async () => {
    configure();
    await expect(paymentService.handleIzipayIpn(ipnBody(answer(), "hmac-key"))).rejects.toThrow("Firma de Izipay inválida");
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it("no marca como pagado si el monto no coincide", async () => {
    configure();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.payment.findUnique.mockResolvedValue(payment({ metodo: "IZIPAY" }));
    const tampered = answer({ orderDetails: { orderId: "ORD-1", orderTotalAmount: 100, orderCurrency: "PEN", metadata: { paymentId: payment().id } } });
    await paymentService.handleIzipayIpn(ipnBody(tampered));
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it("una IPN repetida no vuelve a notificar", async () => {
    configure();
    mockPrisma.payment.findUnique.mockResolvedValue(payment({ metodo: "IZIPAY", estado: "PAGADO" }));
    mockPrisma.payment.findUniqueOrThrow.mockResolvedValue(payment({ metodo: "IZIPAY", estado: "PAGADO" }));
    await paymentService.handleIzipayIpn(ipnBody(answer()));
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });
});

describe("Binance Pay", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const certPem = publicKey.export({ type: "spki", format: "pem" }).toString();

  it("firma las peticiones con HMAC-SHA512 en hexadecimal mayúscula", () => {
    const sig = binance.signRequest("secret", "1700000000000", "a".repeat(32), '{"x":1}');
    expect(sig).toBe(createHmac("sha512", "secret").update(`1700000000000\n${"a".repeat(32)}\n{"x":1}\n`).digest("hex").toUpperCase());
  });

  it("acepta un webhook firmado por Binance y marca el pago como pagado", async () => {
    process.env.BINANCE_PAY_API_KEY = "key";
    process.env.BINANCE_PAY_SECRET = "secret";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status: "SUCCESS", data: [{ certSerial: "serial-1", certPublic: certPem }] }))));
    mockPrisma.payment.findUnique.mockResolvedValue(payment({ metodo: "BINANCE_PAY", detalle: { montoUsdt: 6.64 } }));

    const body = JSON.stringify({
      bizType: "PAY",
      bizStatus: "PAY_SUCCESS",
      data: JSON.stringify({ merchantTradeNo: payment().id.replace(/-/g, ""), totalFee: "6.64", currency: "USDT", transactionId: "bn-1" }),
    });
    const timestamp = "1700000000000";
    const nonce = "b".repeat(32);
    const signature = createSign("RSA-SHA256").update(`${timestamp}\n${nonce}\n${body}\n`).sign(privateKey, "base64");

    const result = await paymentService.handleBinanceWebhook(
      { "binancepay-certificate-sn": "serial-1", "binancepay-timestamp": timestamp, "binancepay-nonce": nonce, "binancepay-signature": signature },
      body
    );

    expect(result).toEqual({ returnCode: "SUCCESS", returnMessage: null });
    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: "PAGADO", referencia: "bn-1" }) })
    );

    // Mismo cuerpo con otra firma → rechazado
    await expect(
      paymentService.handleBinanceWebhook(
        { "binancepay-certificate-sn": "serial-1", "binancepay-timestamp": timestamp, "binancepay-nonce": nonce, "binancepay-signature": Buffer.from("x").toString("base64") },
        body
      )
    ).rejects.toThrow("Firma de Binance Pay inválida");
  });
});
