import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockPlan, mockProduct } from "../../../test/fixtures/index.js";
import * as planService from "../plan.service.js";

describe("Plan Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("debería retornar todos los planes con producto", async () => {
      const planWithProduct = {
        ...mockPlan,
        product: { id: mockProduct.id, nombre: mockProduct.nombre, slug: mockProduct.slug },
      };
      mockPrisma.plan.findMany.mockResolvedValue([planWithProduct]);

      const result = await planService.getAll();

      expect(result).toEqual([planWithProduct]);
      expect(mockPrisma.plan.findMany).toHaveBeenCalled();
    });

    it("debería retornar array vacío si no hay planes", async () => {
      mockPrisma.plan.findMany.mockResolvedValue([]);

      const result = await planService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    it("debería retornar un plan por ID", async () => {
      const planFull = {
        ...mockPlan,
        product: { id: mockProduct.id, nombre: mockProduct.nombre, slug: mockProduct.slug },
      };
      mockPrisma.plan.findUnique.mockResolvedValue(planFull);

      const result = await planService.getById("test-plan-id");

      expect(result).toEqual(planFull);
    });

    it("debería lanzar error si el plan no existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      await expect(planService.getById("non-existent-id")).rejects.toThrow("Plan no encontrado");
    });
  });

  describe("create", () => {
    it("debería crear un plan correctamente", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.plan.create.mockResolvedValue(mockPlan);

      const result = await planService.create({
        nombre: "Plan Test",
        slug: "plan-test",
        duracion: "30 días",
        precio: 29.99,
        productId: "test-product-id",
      });

      expect(result).toEqual(mockPlan);
    });

    it("debería lanzar error si el slug ya existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);

      await expect(
        planService.create({
          nombre: "Otro Plan",
          slug: "plan-test",
          duracion: "30 días",
          precio: 29.99,
          productId: "test-product-id",
        })
      ).rejects.toThrow("Ya existe un plan con ese slug");
    });

    it("debería lanzar error si el producto no existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        planService.create({
          nombre: "Plan Test",
          slug: "nuevo-slug",
          duracion: "30 días",
          precio: 29.99,
          productId: "non-existent-product",
        })
      ).rejects.toThrow("Producto no encontrado");
    });
  });

  describe("update", () => {
    it("debería actualizar un plan correctamente", async () => {
      mockPrisma.plan.findUnique
        .mockResolvedValueOnce(mockPlan)
        .mockResolvedValueOnce(null);
      mockPrisma.plan.update.mockResolvedValue({ ...mockPlan, nombre: "Actualizado" });

      const result = await planService.update("test-plan-id", { nombre: "Actualizado" });

      expect(result.nombre).toBe("Actualizado");
    });

    it("debería lanzar error si el plan no existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      await expect(
        planService.update("non-existent-id", { nombre: "Test" })
      ).rejects.toThrow("Plan no encontrado");
    });

    it("debería lanzar error si el nuevo slug ya existe", async () => {
      mockPrisma.plan.findUnique
        .mockResolvedValueOnce(mockPlan)
        .mockResolvedValueOnce({ id: "other-id", slug: "nuevo-slug" });

      await expect(
        planService.update("test-plan-id", { slug: "nuevo-slug" })
      ).rejects.toThrow("Ya existe un plan con ese slug");
    });
  });

  describe("remove", () => {
    it("debería eliminar un plan correctamente", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrisma.plan.delete.mockResolvedValue(mockPlan);

      const result = await planService.remove("test-plan-id");

      expect(result).toEqual({ message: "Plan eliminado exitosamente" });
    });

    it("debería lanzar error si el plan no existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      await expect(planService.remove("non-existent-id")).rejects.toThrow("Plan no encontrado");
    });
  });
});
