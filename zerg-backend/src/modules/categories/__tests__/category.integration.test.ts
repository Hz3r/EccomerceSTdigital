import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockCategory } from "../../../test/fixtures/index.js";
import { AppError } from "../../../errors/appError.js";

vi.mock("../../../middlewares/auth.middleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = {
      userId: "test-user-id",
      email: "test@test.com",
      rol: "ADMIN",
    };
    next();
  },
}));

vi.mock("../../../middlewares/role.middleware.js", () => ({
  roleMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

import categoryRoutes from "../category.routes.js";

const app = express();
app.use(express.json());
app.use("/api/categories", categoryRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

describe("Category Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/categories", () => {
    it("debería retornar todas las categorías", async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);

      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockCategory]);
    });
  });

  describe("GET /api/categories/:id", () => {
    it("debería retornar una categoría por ID", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      const response = await request(app).get("/api/categories/test-category-id");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCategory);
    });

    it("debería retornar 404 si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/categories/non-existent-id");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/categories", () => {
    it("debería crear una categoría correctamente", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const response = await request(app)
        .post("/api/categories")
        .send({
          nombre: "Categoría Test",
          slug: "categoria-test",
          descripcion: "Una categoría de prueba",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Categoría creada exitosamente");
    });

    it("debería retornar 409 si el slug ya existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      const response = await request(app)
        .post("/api/categories")
        .send({
          nombre: "Otra Categoría",
          slug: "categoria-test",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("debería actualizar una categoría correctamente", async () => {
      mockPrisma.category.findUnique
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(null);
      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        nombre: "Actualizada",
      });

      const response = await request(app)
        .put("/api/categories/test-category-id")
        .send({ nombre: "Actualizada" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Categoría actualizada");
    });

    it("debería retornar 404 si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/categories/non-existent-id")
        .send({ nombre: "Actualizada" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("debería eliminar una categoría correctamente", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.category.delete.mockResolvedValue(mockCategory);

      const response = await request(app).delete(
        "/api/categories/test-category-id"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Categoría eliminada exitosamente");
    });

    it("debería retornar 404 si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app).delete(
        "/api/categories/non-existent-id"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
