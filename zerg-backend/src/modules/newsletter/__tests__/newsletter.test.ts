import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { AppError } from "../../../errors/appError.js";
import * as newsletterService from "../newsletter.service.js";

vi.mock("../../../middlewares/auth.middleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { userId: "admin", email: "admin@test.com", rol: "ADMIN" };
    next();
  },
}));
vi.mock("../../../middlewares/role.middleware.js", () => ({
  roleMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

import newsletterRoutes from "../newsletter.routes.js";

const app = express();
app.use(express.json());
app.use("/api/newsletter", newsletterRoutes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

const sub = (patch: Record<string, unknown> = {}) => ({
  id: "s1",
  nombre: "Ana",
  email: "ana@test.com",
  activo: true,
  creadoEn: new Date("2026-11-01T10:00:00Z"),
  actualizado: new Date("2026-11-01T10:00:00Z"),
  ...patch,
});

describe("Boletín", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.subscriber.upsert.mockResolvedValue({});
  });

  it("suscribe limpiando el correo y reactiva si ya existía", async () => {
    const res = await request(app).post("/api/newsletter/subscribe").send({ nombre: "  Ana ", email: " ANA@Test.com " });

    expect(res.status).toBe(200);
    expect(mockPrisma.subscriber.upsert).toHaveBeenCalledWith({
      where: { email: "ana@test.com" },
      create: { nombre: "Ana", email: "ana@test.com" },
      update: { nombre: "Ana", activo: true },
    });
  });

  it("rechaza correos inválidos o sin nombre", async () => {
    for (const body of [{ nombre: "Ana", email: "no-es-correo" }, { nombre: "", email: "ana@test.com" }, {}]) {
      const res = await request(app).post("/api/newsletter/subscribe").send(body);
      expect(res.status).toBe(400);
    }
    expect(mockPrisma.subscriber.upsert).not.toHaveBeenCalled();
  });

  it("lista con totales para el admin", async () => {
    mockPrisma.subscriber.findMany.mockResolvedValue([sub(), sub({ id: "s2", activo: false })]);
    const res = await request(app).get("/api/newsletter");
    expect(res.body.data).toMatchObject({ total: 2, activos: 1 });
  });

  it("exporta CSV sin permitir fórmulas de Excel", async () => {
    mockPrisma.subscriber.findMany.mockResolvedValue([sub({ nombre: '=HYPERLINK("x")' })]);
    const res = await request(app).get("/api/newsletter/export");

    expect(res.headers["content-type"]).toContain("text/csv");
    expect(mockPrisma.subscriber.findMany.mock.calls[0]![0].where).toEqual({ activo: true });
    expect(res.text).toContain(`"'=HYPERLINK(""x"")","ana@test.com","activo","2026-11-01"`);
  });

  it("da de baja y borra; 404 si no existe", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue(sub());
    mockPrisma.subscriber.update.mockResolvedValue(sub({ activo: false }));
    expect((await request(app).patch("/api/newsletter/s1").send({ activo: false })).status).toBe(200);
    expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { activo: false } });
    expect((await request(app).delete("/api/newsletter/s1")).status).toBe(200);

    mockPrisma.subscriber.findUnique.mockResolvedValue(null);
    expect((await request(app).delete("/api/newsletter/nada")).status).toBe(404);
  });

  it("setActivo exige un booleano", async () => {
    await expect(newsletterService.setActivo("s1", "si")).rejects.toThrow("activo");
  });
});
