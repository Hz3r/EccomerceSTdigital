import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { AppError } from "../../../errors/appError.js";
import { migrate, sanitize } from "../settings.service.js";
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
      header: { mostrarOfertas: "no" },
      footer: { metodosPago: ["Yape", 5, "  Plin  "] },
      extra: { a: 1 },
    }) as typeof defaultSettings;

    expect(result.marca.nombre).toBe("Mi Tienda");
    expect(result.marca.logoUrl).toBe("");
    expect(result).not.toHaveProperty("extra");
    expect(result.marca).not.toHaveProperty("hack");
    expect(result.header.mostrarOfertas).toBe(true);
    expect(result.footer.metodosPago).toEqual(["Yape", "Plin"]);
  });

  it("valida las listas de objetos campo por campo, también anidadas", () => {
    const result = sanitize(defaultSettings as never, {
      header: {
        menu: [
          "texto suelto",
          5,
          {
            etiqueta: " Tarjetas ",
            desplegable: true,
            hack: "x",
            grupos: [{ titulo: "Gift cards", enlaces: [{ etiqueta: "Steam", url: "/product/steam-wallet", imagenUrl: 3 }, null] }],
          },
        ],
      },
    }) as typeof defaultSettings;

    expect(result.header.menu).toHaveLength(2);
    expect(result.header.menu[0]).toEqual({ etiqueta: "texto suelto", categoria: "", url: "", desplegable: false, grupos: [] });
    expect(result.header.menu[1]).toEqual({
      etiqueta: "Tarjetas",
      categoria: "",
      url: "",
      desplegable: true,
      grupos: [{ titulo: "Gift cards", enlaces: [{ etiqueta: "Steam", url: "/product/steam-wallet", imagenUrl: "" }] }],
    });
  });

  it("convierte las plataformas guardadas solo como texto", () => {
    const result = sanitize(defaultSettings as never, {
      portada: { plataformas: ["Netflix", { nombre: "Max", logoUrl: "/api/uploads/branding/max.png" }] },
    }) as typeof defaultSettings;
    expect(result.portada.plataformas).toEqual([
      { nombre: "Netflix", logoUrl: "" },
      { nombre: "Max", logoUrl: "/api/uploads/branding/max.png" },
    ]);
  });
});

describe("migrate", () => {
  it("pasa el antiguo categoriasMenu al nuevo menú", () => {
    const migrated = migrate({ header: { categoriasMenu: ["ia", "gaming"] } });
    const result = sanitize(defaultSettings as never, migrated) as typeof defaultSettings;
    expect(result.header.menu.map((m) => m.categoria)).toEqual(["ia", "gaming"]);
    expect(result.header).not.toHaveProperty("categoriasMenu");
  });

  it("no toca un menú ya guardado", () => {
    const value = { header: { categoriasMenu: ["ia"], menu: [] } };
    expect(migrate(value)).toBe(value);
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
