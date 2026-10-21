import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockReview, mockProduct, mockUser } from "../../../test/fixtures/index.js";

// Prisma devuelve las relaciones pedidas en `include`.
const reviewProduct = { id: "test-product-id", nombre: "Netflix Premium", slug: "netflix-premium" };
const createdReview = { ...mockReview, product: reviewProduct, user: { nombre: "Test User" } };
import * as reviewService from "../review.service.js";

describe("Review Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("debería retornar todas las reseñas con producto y usuario", async () => {
      const reviewFull = {
        ...mockReview,
        product: { id: mockProduct.id, nombre: mockProduct.nombre, slug: mockProduct.slug },
        user: { id: mockUser.id, nombre: mockUser.nombre },
      };
      mockPrisma.review.findMany.mockResolvedValue([reviewFull]);

      const result = await reviewService.getAll();

      expect(result).toEqual([reviewFull]);
      expect(mockPrisma.review.findMany).toHaveBeenCalled();
    });
  });

  describe("getByProduct", () => {
    it("debería retornar las reseñas de un producto", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);

      const result = await reviewService.getByProduct("test-product-id");

      expect(result).toEqual([mockReview]);
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { productId: "test-product-id", isApproved: true },
        include: expect.any(Object),
        orderBy: { creadoEn: "desc" },
      });
    });

    it("debería lanzar error si el producto no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        reviewService.getByProduct("non-existent-id")
      ).rejects.toThrow("Producto no encontrado");
    });
  });

  describe("getById", () => {
    it("debería retornar una reseña por ID", async () => {
      const reviewFull = {
        ...mockReview,
        product: { id: mockProduct.id, nombre: mockProduct.nombre, slug: mockProduct.slug },
        user: { id: mockUser.id, nombre: mockUser.nombre },
      };
      mockPrisma.review.findUnique.mockResolvedValue(reviewFull);

      const result = await reviewService.getById("test-review-id");

      expect(result).toEqual(reviewFull);
    });

    it("debería lanzar error si la reseña no existe", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(
        reviewService.getById("non-existent-id")
      ).rejects.toThrow("Reseña no encontrada");
    });
  });

  describe("create", () => {
    it("debería crear una reseña correctamente", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(createdReview);

      const result = await reviewService.create({
        puntuacion: 5,
        comentario: "Excelente producto",
        productId: "test-product-id",
        userId: "test-user-id",
      });

      expect(result).toEqual(createdReview);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ audiencia: "ADMIN", tipo: "RESENA", titulo: "Nueva reseña por aprobar" }),
      });
    });

    it("debería rechazar puntuaciones fuera de 1 a 5", async () => {
      await expect(
        reviewService.create({ puntuacion: 6, productId: "test-product-id", userId: "test-user-id" })
      ).rejects.toThrow("La puntuación debe ser de 1 a 5 estrellas");
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    it("debería lanzar error si el producto no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        reviewService.create({
          puntuacion: 5,
          productId: "non-existent-id",
          userId: "test-user-id",
        })
      ).rejects.toThrow("Producto no encontrado");
    });

    it("debería lanzar error si ya existe una reseña del usuario para ese producto", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        reviewService.create({
          puntuacion: 4,
          productId: "test-product-id",
          userId: "test-user-id",
        })
      ).rejects.toThrow("Ya has reseñado este producto");
    });
  });

  describe("approve", () => {
    it("debería aprobar una reseña", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue({ ...mockReview, isApproved: true, product: reviewProduct });

      const result = await reviewService.approve("test-review-id");

      expect(result.isApproved).toBe(true);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ audiencia: "CLIENTE", userId: "test-user-id", tipo: "RESENA", titulo: "Tu reseña fue publicada" }),
      });
    });

    it("debería lanzar error si la reseña no existe", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(
        reviewService.approve("non-existent-id")
      ).rejects.toThrow("Reseña no encontrada");
    });
  });

  describe("remove", () => {
    it("debería eliminar una reseña (admin)", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);

      const result = await reviewService.remove("test-review-id");

      expect(result).toEqual({ message: "Reseña eliminada exitosamente" });
    });

    it("debería eliminar una reseña (propietario)", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);

      const result = await reviewService.remove("test-review-id", "test-user-id");

      expect(result).toEqual({ message: "Reseña eliminada exitosamente" });
    });

    it("debería lanzar error si no es propietario ni admin", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        reviewService.remove("test-review-id", "other-user-id")
      ).rejects.toThrow("No puedes eliminar esta reseña");
    });

    it("debería lanzar error si la reseña no existe", async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(
        reviewService.remove("non-existent-id")
      ).rejects.toThrow("Reseña no encontrada");
    });
  });
});
