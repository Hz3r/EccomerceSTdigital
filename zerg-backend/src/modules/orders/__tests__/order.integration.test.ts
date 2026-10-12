import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockOrder, mockPlan } from "../../../test/fixtures/index.js";
import { AppError } from "../../../errors/appError.js";

vi.mock("../../../middlewares/auth.middleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { userId: "test-user-id", email: "test@test.com", rol: "ADMIN" };
    next();
  },
}));

vi.mock("../../../middlewares/role.middleware.js", () => ({
  roleMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

import orderRoutes from "../order.routes.js";

const app = express();
app.use(express.json());
app.use("/api/orders", orderRoutes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

describe("Order Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/orders", () => {
    it("debería retornar todas las órdenes", async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      const response = await request(app).get("/api/orders");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockOrder]);
    });
  });

  describe("GET /api/orders/:id", () => {
    it("debería retornar una orden por ID", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const response = await request(app).get("/api/orders/test-order-id");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 404 si la orden no existe", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/orders/non-existent-id");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/orders", () => {
    it("debería crear una orden correctamente", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const response = await request(app)
        .post("/api/orders")
        .send({
          nombreCliente: "Juan Pérez",
          email: "juan@test.com",
          items: [{ planId: "test-plan-id", cantidad: 1 }],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 400 si no hay items", async () => {
      const response = await request(app)
        .post("/api/orders")
        .send({
          nombreCliente: "Juan Pérez",
          email: "juan@test.com",
          items: [],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/orders/:id/status", () => {
    it("debería actualizar el estado de una orden", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: "ENVIADO" });

      const response = await request(app)
        .patch("/api/orders/test-order-id/status")
        .send({ status: "ENVIADO" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 404 si la orden no existe", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch("/api/orders/non-existent-id/status")
        .send({ status: "ENVIADO" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/orders/:id", () => {
    it("debería eliminar una orden correctamente", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.orderItem.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.order.delete.mockResolvedValue(mockOrder);

      const response = await request(app).delete("/api/orders/test-order-id");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Orden eliminada exitosamente");
    });

    it("debería retornar 404 si la orden no existe", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const response = await request(app).delete("/api/orders/non-existent-id");

      expect(response.status).toBe(404);
    });
  });
});
