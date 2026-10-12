import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockProduct, mockCategory } from "../../../test/fixtures/index.js";
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

import productRoutes from "../product.routes.js";

const app = express();
app.use(express.json());
app.use("/api/products", productRoutes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

describe("Product Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/products", () => {
    it("debería retornar todos los productos", async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);

      const response = await request(app).get("/api/products");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockProduct]);
    });
  });

  describe("GET /api/products/:id", () => {
    it("debería retornar un producto por ID", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const response = await request(app).get("/api/products/test-product-id");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar un producto por slug", async () => {
      mockPrisma.product.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProduct);

      const response = await request(app).get("/api/products/netflix-premium");

      expect(response.status).toBe(200);
      expect(mockPrisma.product.findUnique).toHaveBeenLastCalledWith(
        expect.objectContaining({ where: { slug: "netflix-premium" } })
      );
    });

    it("debería retornar 404 si el producto no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/products/non-existent-id");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/products", () => {
    it("debería crear un producto correctamente", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const response = await request(app)
        .post("/api/products")
        .send({
          nombre: "Producto Test",
          slug: "producto-test",
          categoryId: "test-category-id",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 409 si el slug ya existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const response = await request(app)
        .post("/api/products")
        .send({ nombre: "Otro", slug: "producto-test", categoryId: "test-category-id" });

      expect(response.status).toBe(409);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("debería actualizar un producto correctamente", async () => {
      mockPrisma.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(null);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, nombre: "Updated" });

      const response = await request(app)
        .put("/api/products/test-product-id")
        .send({ nombre: "Updated" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 404 si el producto no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/products/non-existent-id")
        .send({ nombre: "Test" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("debería eliminar un producto correctamente", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      const response = await request(app).delete("/api/products/test-product-id");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Producto eliminado exitosamente");
    });

    it("debería retornar 404 si el producto no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const response = await request(app).delete("/api/products/non-existent-id");

      expect(response.status).toBe(404);
    });
  });
});
