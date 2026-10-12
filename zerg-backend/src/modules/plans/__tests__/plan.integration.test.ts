import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockPlan, mockProduct } from "../../../test/fixtures/index.js";
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

import planRoutes from "../plan.routes.js";

const app = express();
app.use(express.json());
app.use("/api/plans", planRoutes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

describe("Plan Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/plans", () => {
    it("debería retornar todos los planes", async () => {
      mockPrisma.plan.findMany.mockResolvedValue([mockPlan]);

      const response = await request(app).get("/api/plans");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockPlan]);
    });
  });

  describe("GET /api/plans/:id", () => {
    it("debería retornar un plan por ID", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);

      const response = await request(app).get("/api/plans/test-plan-id");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 404 si el plan no existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/plans/non-existent-id");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/plans", () => {
    it("debería crear un plan correctamente", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.plan.create.mockResolvedValue(mockPlan);

      const response = await request(app)
        .post("/api/plans")
        .send({
          nombre: "Plan Test",
          slug: "plan-test",
          duracion: "30 días",
          precio: 29.99,
          productId: "test-product-id",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 409 si el slug ya existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);

      const response = await request(app)
        .post("/api/plans")
        .send({ nombre: "Otro", slug: "plan-test", duracion: "30d", precio: 10, productId: "x" });

      expect(response.status).toBe(409);
    });
  });

  describe("PUT /api/plans/:id", () => {
    it("debería actualizar un plan correctamente", async () => {
      mockPrisma.plan.findUnique
        .mockResolvedValueOnce(mockPlan)
        .mockResolvedValueOnce(null);
      mockPrisma.plan.update.mockResolvedValue({ ...mockPlan, nombre: "Updated" });

      const response = await request(app)
        .put("/api/plans/test-plan-id")
        .send({ nombre: "Updated" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 404 si el plan no existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/plans/non-existent-id")
        .send({ nombre: "Test" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/plans/:id", () => {
    it("debería eliminar un plan correctamente", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrisma.plan.delete.mockResolvedValue(mockPlan);

      const response = await request(app).delete("/api/plans/test-plan-id");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Plan eliminado exitosamente");
    });

    it("debería retornar 404 si el plan no existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      const response = await request(app).delete("/api/plans/non-existent-id");

      expect(response.status).toBe(404);
    });
  });
});
