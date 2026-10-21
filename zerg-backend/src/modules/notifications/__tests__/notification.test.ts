import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { AppError } from "../../../errors/appError.js";

// El usuario de la sesión se elige por cabecera para probar admin y cliente.
vi.mock("../../../middlewares/auth.middleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = req.headers["x-test-rol"] === "ADMIN"
      ? { userId: "admin-1", email: "a@test.com", rol: "ADMIN" }
      : { userId: "cliente-1", email: "c@test.com", rol: "CLIENTE" };
    next();
  },
}));

import notificationRoutes from "../notification.routes.js";

const app = express();
app.use(express.json());
app.use("/api/notifications", notificationRoutes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err instanceof AppError ? err.statusCode : 500).json({ success: false, message: err.message });
});

describe("Notifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.groupBy.mockResolvedValue([
      { tipo: "COMPRA", _count: { _all: 2 } },
      { tipo: "VENTA", _count: { _all: 1 } },
    ]);
  });

  it("el admin ve los avisos del panel con los no leídos por tipo", async () => {
    const res = await request(app).get("/api/notifications?tipo=compra").set("x-test-rol", "ADMIN");

    expect(res.status).toBe(200);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { audiencia: "ADMIN", tipo: "COMPRA" } })
    );
    expect(res.body.data).toMatchObject({ unread: 3, unreadByTipo: { COMPRA: 2, VENTA: 1, PEDIDO: 0, RESENA: 0 } });
  });

  it("un cliente solo ve sus propios avisos", async () => {
    await request(app).get("/api/notifications");
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { audiencia: "CLIENTE", userId: "cliente-1" } })
    );
  });

  it("un cliente no puede marcar como leído un aviso ajeno", async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });
    const res = await request(app).patch("/api/notifications/ajena/read");

    expect(res.status).toBe(404);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "ajena", audiencia: "CLIENTE", userId: "cliente-1" },
      data: { leida: true },
    });
  });

  it("marcar todo como leído respeta el tipo y el dueño", async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 4 });
    const res = await request(app).post("/api/notifications/read-all?tipo=venta").set("x-test-rol", "ADMIN");

    expect(res.body.data).toEqual({ updated: 4 });
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { audiencia: "ADMIN", leida: false, tipo: "VENTA" },
      data: { leida: true },
    });
  });
});
