import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { AppError } from "../../../errors/appError.js";
import { sanitize } from "../settings.service.js";
import { defaultSettings } from "../settings.defaults.js";

vi.mock("../../../middlewares/auth.middleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { userId: "admin", email: "admin@test.com", rol: "ADMIN" };
    next();
  },
}));

vi.mock("../../../middlewares/role.middleware.js", () => ({
  roleMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

import settingsRoutes from "../settings.routes.js";

const app = express();
app.use(express.json());
app.use("/api/settings", settingsRoutes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

describe("sanitize", () => {
  it("descarta claves desconocidas y tipos incorrectos", () => {
    const result = sanitize(defaultSettings as never, {
      marca: { nombre: "Mi Tienda", logoUrl: 123, hack: "x" },
      header: { mostrarOfertas: "no", categoriasMenu: ["ia", 5, "  diseno  "] },
      extra: { a: 1 },
    }) as typeof defaultSettings;

    expect(result.marca.nombre).toBe("Mi Tienda");
    expect(result.marca.logoUrl).toBe("");
    expect(result).not.toHaveProperty("extra");
    expect(result.marca).not.toHaveProperty("hack");
    expect(result.header.mostrarOfertas).toBe(true);
    expect(result.header.categoriasMenu).toEqual(["ia", "diseno"]);
  });
});

describe("Settings API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET devuelve los valores por defecto si no hay nada guardado", async () => {
    mockPrisma.siteSetting.findUnique.mockResolvedValue(null);
    const res = await request(app).get("/api/settings");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(defaultSettings);
  });

  it("PUT combina un cambio parcial con lo guardado", async () => {
    mockPrisma.siteSetting.findUnique.mockResolvedValue({
      key: "site",
      value: { header: { anuncio: "Envío gratis" } },
    });
    mockPrisma.siteSetting.upsert.mockResolvedValue({});

    const res = await request(app)
      .put("/api/settings")
      .send({ portada: { hero: { titulo: "Nuevo título" } } });

    expect(res.status).toBe(200);
    expect(res.body.data.header.anuncio).toBe("Envío gratis");
    expect(res.body.data.portada.hero.titulo).toBe("Nuevo título");
    expect(res.body.data.portada.hero.tituloDestacado).toBe(defaultSettings.portada.hero.tituloDestacado);
  });

  it("GET responde con valores por defecto y aviso si falta la migración", async () => {
    mockPrisma.siteSetting.findUnique.mockRejectedValue(Object.assign(new Error("table does not exist"), { code: "P2021" }));
    const res = await request(app).get("/api/settings");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(defaultSettings);
    expect(res.body.setupRequired).toBe(true);
    expect(res.body.message).toContain("prisma migrate deploy");
  });

  it("PUT explica cómo preparar la base si falta la migración", async () => {
    mockPrisma.siteSetting.findUnique.mockResolvedValue(null);
    mockPrisma.siteSetting.upsert.mockRejectedValue(Object.assign(new Error("table does not exist"), { code: "P2021" }));
    const res = await request(app).put("/api/settings").send({ header: { anuncio: "Hola" } });
    expect(res.status).toBe(503);
    expect(res.body.message).toContain("prisma generate");
  });

  it("PUT rechaza un cuerpo que no es objeto", async () => {
    const res = await request(app).put("/api/settings").send([1, 2]);
    expect(res.status).toBe(400);
  });
});
