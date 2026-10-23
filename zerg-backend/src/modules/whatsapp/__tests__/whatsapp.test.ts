import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { insideWindow, isValidSignature, normalizePhone, templateParam } from "../whatsapp.client.js";
import * as whatsappService from "../whatsapp.service.js";

const ENV = {
  WHATSAPP_TOKEN: "tok",
  WHATSAPP_PHONE_NUMBER_ID: "123456",
  WHATSAPP_VERIFY_TOKEN: "verify",
  WHATSAPP_APP_SECRET: "secret",
};

const payload = (message: Record<string, unknown>) => ({
  object: "whatsapp_business_account",
  entry: [{ changes: [{ field: "messages", value: { contacts: [{ wa_id: "51987654321", profile: { name: "Luis" } }], messages: [message] } }] }],
});

const metaOk = () =>
  vi.fn().mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid.OUT" }] }) } as unknown as Response);

describe("WhatsApp Business", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(process.env, ENV);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    for (const key of [...Object.keys(ENV), "WHATSAPP_TEMPLATE_REPLY", "WHATSAPP_TEMPLATE_CREDENTIALS"]) delete process.env[key];
  });

  it("verifica la firma de Meta sobre el cuerpo sin procesar", () => {
    const body = Buffer.from('{"a":1}');
    const sig = `sha256=${createHmac("sha256", "secret").update(body).digest("hex")}`;
    expect(isValidSignature(body, sig, "secret")).toBe(true);
    expect(isValidSignature(Buffer.from('{"a":2}'), sig, "secret")).toBe(false);
    expect(isValidSignature(body, undefined, "secret")).toBe(false);
  });

  it("normaliza celulares peruanos y limpia variables de plantilla", () => {
    expect(normalizePhone("987 654 321")).toBe("51987654321");
    expect(normalizePhone("+51 987-654-321")).toBe("51987654321");
    expect(normalizePhone("123")).toBeNull();
    expect(templateParam("línea 1\nlínea 2")).toBe("línea 1 · línea 2");
  });

  it("la ventana de 24 h depende del último mensaje del cliente", () => {
    const now = Date.now();
    expect(insideWindow(new Date(now - 60_000), now)).toBe(true);
    expect(insideWindow(new Date(now - 25 * 3600_000), now)).toBe(false);
    expect(insideWindow(null, now)).toBe(false);
  });

  it("un mensaje entrante de un número nuevo crea un chat de WhatsApp y avisa al admin", async () => {
    mockPrisma.message.findUnique.mockResolvedValue(null);
    mockPrisma.conversation.findUnique.mockResolvedValue(null);
    mockPrisma.conversation.create.mockResolvedValue({ id: "conv-wa" });

    const saved = await whatsappService.handleWebhook(payload({ from: "51987654321", id: "wamid.1", timestamp: "1700000000", type: "text", text: { body: "Hola, quiero Netflix" } }));

    expect(saved).toBe(1);
    expect(mockPrisma.conversation.create.mock.calls[0]![0].data).toMatchObject({
      canal: "WHATSAPP",
      waId: "51987654321",
      nombre: "Luis",
      noLeidasAdmin: 1,
      messages: { create: { autor: "CLIENTE", texto: "Hola, quiero Netflix", waMessageId: "wamid.1" } },
    });
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({ data: expect.objectContaining({ audiencia: "ADMIN", href: "/chat?c=conv-wa" }) });
  });

  it("ignora mensajes repetidos por reintentos de Meta", async () => {
    mockPrisma.message.findUnique.mockResolvedValue({ id: "m1" });
    const saved = await whatsappService.handleWebhook(payload({ from: "51987654321", id: "wamid.1", type: "text", text: { body: "hola" } }));
    expect(saved).toBe(0);
    expect(mockPrisma.conversation.create).not.toHaveBeenCalled();
    expect(mockPrisma.message.create).not.toHaveBeenCalled();
  });

  it("un chat existente suma el mensaje y renueva la ventana de 24 h", async () => {
    mockPrisma.message.findUnique.mockResolvedValue(null);
    mockPrisma.conversation.findUnique.mockResolvedValue({ id: "conv-wa", nombre: "Luis", estado: "ABIERTA" });
    mockPrisma.message.create.mockResolvedValue({});

    await whatsappService.handleWebhook(payload({ from: "51987654321", id: "wamid.2", timestamp: "1700000000", type: "image", image: { caption: "comprobante" } }));

    expect(mockPrisma.message.create.mock.calls[0]![0].data).toMatchObject({ texto: "[📷 Imagen: comprobante — ábrelo en WhatsApp]", waMessageId: "wamid.2" });
    expect(mockPrisma.conversation.update.mock.calls[0]![0].data).toMatchObject({ ultimoEntranteEn: new Date(1700000000 * 1000) });
  });

  it("responde con texto libre dentro de las 24 h", async () => {
    const fetchMock = metaOk();
    vi.stubGlobal("fetch", fetchMock);
    const id = await whatsappService.replyToChat({ waId: "51987654321", ultimoEntranteEn: new Date() }, "¡Hola!");
    expect(id).toBe("wamid.OUT");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://graph.facebook.com/v21.0/123456/messages");
    expect(JSON.parse(init.body)).toMatchObject({ messaging_product: "whatsapp", to: "51987654321", type: "text", text: { body: "¡Hola!" } });
  });

  it("fuera de las 24 h exige una plantilla aprobada", async () => {
    const old = new Date(Date.now() - 48 * 3600_000);
    await expect(whatsappService.replyToChat({ waId: "51987654321", ultimoEntranteEn: old }, "Hola")).rejects.toMatchObject({ statusCode: 409 });

    process.env.WHATSAPP_TEMPLATE_REPLY = "respuesta_soporte";
    const fetchMock = metaOk();
    vi.stubGlobal("fetch", fetchMock);
    await whatsappService.replyToChat({ waId: "51987654321", ultimoEntranteEn: old }, "Hola\nte escribo");
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({
      type: "template",
      template: { name: "respuesta_soporte", language: { code: "es" }, components: [{ type: "body", parameters: [{ type: "text", text: "Hola · te escribo" }] }] },
    });
  });

  it("sin configuración no intenta enviar", async () => {
    delete process.env.WHATSAPP_TOKEN;
    await expect(whatsappService.replyToChat({ waId: "1", ultimoEntranteEn: new Date() }, "x")).rejects.toMatchObject({ statusCode: 503 });
    expect(whatsappService.status().conectado).toBe(false);
  });
});
