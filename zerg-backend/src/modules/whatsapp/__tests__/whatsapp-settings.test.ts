import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { AppError } from "../../../errors/appError.js";
import { decrypt } from "../../../utils/crypto.js";
import { whatsappConfig } from "../whatsapp.client.js";
import { loadWhatsappSettings, resetWhatsappSettingsCache, updateWhatsappSettings } from "../whatsapp.settings.js";

vi.mock("../../../middlewares/auth.middleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { userId: "admin", email: "admin@test.com", rol: "ADMIN" };
    next();
  },
}));

vi.mock("../../../middlewares/role.middleware.js", () => ({
  roleMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

import whatsappRoutes from "../whatsapp.routes.js";

const app = express();
app.use("/api/whatsapp", whatsappRoutes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

const ENV_KEYS = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_TEMPLATE_REPLY"];
const PANEL = { token: "EAAG-secreto-1234", phoneNumberId: "109876543210", verifyToken: "zerg-verify", appSecret: "app-secret-9999" };

const savedValue = () => mockPrisma.siteSetting.upsert.mock.calls.at(-1)![0].update.value as Record<string, string>;

describe("Configuración de WhatsApp desde el panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    resetWhatsappSettingsCache();
    mockPrisma.siteSetting.upsert.mockResolvedValue({});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("guarda los secretos cifrados y conecta con los datos del panel", async () => {
    expect(whatsappConfig()).toBeNull();
    await updateWhatsappSettings(PANEL);

    const value = savedValue();
    expect(value.phoneNumberId).toBe("109876543210");
    expect(value.token).not.toContain("EAAG");
    expect(decrypt(value.token!)).toBe("EAAG-secreto-1234");
    expect(decrypt(value.appSecret!)).toBe("app-secret-9999");
    expect(whatsappConfig()).toMatchObject({ token: "EAAG-secreto-1234", phoneNumberId: "109876543210", verifyToken: "zerg-verify", countryCode: "51" });
  });

  it("lo guardado en el panel tiene prioridad y un campo vacío usa el .env", async () => {
    Object.assign(process.env, { WHATSAPP_TOKEN: "env-token", WHATSAPP_PHONE_NUMBER_ID: "111111", WHATSAPP_VERIFY_TOKEN: "env-verify", WHATSAPP_APP_SECRET: "env-secret" });
    expect(whatsappConfig()?.token).toBe("env-token");

    await updateWhatsappSettings({ token: "panel-token", templateReply: "respuesta_zerg" });
    expect(whatsappConfig()).toMatchObject({ token: "panel-token", phoneNumberId: "111111", templates: { reply: "respuesta_zerg" } });
  });

  it("un secreto vacío se conserva, null lo borra y desactivar desconecta", async () => {
    await updateWhatsappSettings(PANEL);
    await updateWhatsappSettings({ token: "", appSecret: undefined, language: "es_PE" });
    expect(whatsappConfig()).toMatchObject({ token: "EAAG-secreto-1234", appSecret: "app-secret-9999", language: "es_PE" });

    await updateWhatsappSettings({ activo: false });
    expect(whatsappConfig()).toBeNull();

    await updateWhatsappSettings({ activo: true, appSecret: null });
    expect(whatsappConfig()).toBeNull();
    expect(savedValue()).not.toHaveProperty("appSecret");
  });

  it("valida el Phone Number ID y el código de país", async () => {
    await expect(updateWhatsappSettings({ phoneNumberId: "+51 999" })).rejects.toMatchObject({ statusCode: 400 });
    await expect(updateWhatsappSettings({ countryCode: "Perú" })).rejects.toMatchObject({ statusCode: 400 });
    await expect(updateWhatsappSettings({ token: 123 })).rejects.toMatchObject({ statusCode: 400 });
    expect(mockPrisma.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("al iniciar lee y descifra lo guardado", async () => {
    await updateWhatsappSettings(PANEL);
    const stored = savedValue();
    resetWhatsappSettingsCache();
    mockPrisma.siteSetting.findUnique.mockResolvedValue({ key: "whatsapp", value: stored });
    await loadWhatsappSettings();
    expect(mockPrisma.siteSetting.findUnique).toHaveBeenCalledWith({ where: { key: "whatsapp" } });
    expect(whatsappConfig()?.token).toBe("EAAG-secreto-1234");
  });

  it("GET /config nunca devuelve el token ni el App Secret", async () => {
    await updateWhatsappSettings(PANEL);
    const res = await request(app).get("/api/whatsapp/config");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ conectado: true, phoneNumberId: "109876543210", verifyToken: "zerg-verify", token: "••••1234", appSecret: "••••9999" });
    expect(JSON.stringify(res.body)).not.toContain("EAAG-secreto");
    expect(JSON.stringify(res.body)).not.toContain("app-secret-9999");
  });

  it("PUT /config guarda y responde la vista sin secretos", async () => {
    const res = await request(app).put("/api/whatsapp/config").send(PANEL);
    expect(res.status).toBe(200);
    expect(res.body.data.conectado).toBe(true);
    expect(res.body.data.token).toBe("••••1234");

    const bad = await request(app).put("/api/whatsapp/config").send({ phoneNumberId: "abc" });
    expect(bad.status).toBe(400);
  });

  it("POST /config/test consulta el número en Meta", async () => {
    await updateWhatsappSettings(PANEL);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ display_phone_number: "+51 999 888 777", verified_name: "ZERG", quality_rating: "GREEN" }),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    const res = await request(app).post("/api/whatsapp/config/test");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ numero: "+51 999 888 777", nombre: "ZERG", calidad: "GREEN" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain("https://graph.facebook.com/v21.0/109876543210?fields=");
    expect(init.headers.Authorization).toBe("Bearer EAAG-secreto-1234");
  });

  it("POST /config/test explica un token inválido", async () => {
    await updateWhatsappSettings(PANEL);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: { code: 190, message: "expired" } }) } as unknown as Response));
    const res = await request(app).post("/api/whatsapp/config/test");
    expect(res.status).toBe(502);
    expect(res.body.message).toContain("token");
  });

  it("el webhook de Meta usa el verify token del panel", async () => {
    await updateWhatsappSettings(PANEL);
    const ok = await request(app).get("/api/whatsapp/webhook").query({ "hub.mode": "subscribe", "hub.verify_token": "zerg-verify", "hub.challenge": "42" });
    expect(ok.status).toBe(200);
    expect(ok.text).toBe("42");
    const bad = await request(app).get("/api/whatsapp/webhook").query({ "hub.mode": "subscribe", "hub.verify_token": "otro", "hub.challenge": "42" });
    expect(bad.status).toBe(403);
  });
});
