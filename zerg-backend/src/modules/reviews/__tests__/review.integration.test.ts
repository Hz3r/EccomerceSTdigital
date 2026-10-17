import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockReview, mockProduct } from "../../../test/fixtures/index.js";
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

import reviewRoutes from "../review.routes.js";

const app = express();
app.use(express.json());
app.use("/api/reviews", reviewRoutes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  res.status(500).json({ success: false, message: "Error interno del servidor" });
});

describe("Review Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/reviews/latest", () => {
    it("debería retornar solo reseñas aprobadas y limitar la cantidad", async () => {
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);

      const response = await request(app).get("/api/reviews/latest?limit=500");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([mockReview]);
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isApproved: true }, take: 50 })
      );
    });
  });

  describe("GET /api/reviews/product/:productId", () => {
    it("debería retornar las reseñas de un producto", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);

      const response = await request(app).get("/api/reviews/product/test-product-id");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([mockReview]);
    });

    it("debería retornar 404 si el producto no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/reviews/product/non-existent-id");

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/reviews/:id", () => {
    it("debería retornar una reseña por ID", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const response = await request(app).get("/api/reviews/test-review-id");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 404 si la reseña no existe", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/reviews/non-existent-id");

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/reviews", () => {
    it("debería crear una reseña correctamente", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(mockReview);

      const response = await request(app)
        .post("/api/reviews")
        .send({
          puntuacion: 5,
          comentario: "Excelente producto",
          productId: "test-product-id",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 409 si ya existe una reseña del usuario", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const response = await request(app)
        .post("/api/reviews")
        .send({ puntuacion: 4, productId: "test-product-id" });

      expect(response.status).toBe(409);
    });
  });

  describe("PATCH /api/reviews/:id/approve", () => {
    it("debería aprobar una reseña", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue({ ...mockReview, isApproved: true });

      const response = await request(app).patch("/api/reviews/test-review-id/approve");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("debería retornar 404 si la reseña no existe", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      const response = await request(app).patch("/api/reviews/non-existent-id/approve");

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/reviews/:id", () => {
    it("debería eliminar una reseña correctamente", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);

      const response = await request(app).delete("/api/reviews/test-review-id");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Reseña eliminada exitosamente");
    });

    it("debería retornar 404 si la reseña no existe", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      const response = await request(app).delete("/api/reviews/non-existent-id");

      expect(response.status).toBe(404);
    });
  });
});
