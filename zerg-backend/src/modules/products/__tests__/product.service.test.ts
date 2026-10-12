import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockProduct, mockCategory } from "../../../test/fixtures/index.js";
import * as productService from "../product.service.js";

describe("Product Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getAll", () => {
    it("debería retornar todos los productos con categoría y planes", async () => {
      const productWithRelations = {
        ...mockProduct,
        category: { id: mockCategory.id, nombre: mockCategory.nombre, slug: mockCategory.slug },
        plans: [],
      };
      mockPrisma.product.findMany.mockResolvedValue([productWithRelations]);

      const result = await productService.getAll();

      expect(result).toEqual([productWithRelations]);
      expect(mockPrisma.product.findMany).toHaveBeenCalled();
    });

    it("debería retornar array vacío si no hay productos", async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const result = await productService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    it("debería retornar un producto por ID con relaciones", async () => {
      const productFull = {
        ...mockProduct,
        category: { id: mockCategory.id, nombre: mockCategory.nombre, slug: mockCategory.slug },
        plans: [],
        reviews: [],
      };
      mockPrisma.product.findUnique.mockResolvedValue(productFull);

      const result = await productService.getById("test-product-id");

      expect(result).toEqual(productFull);
      expect(mockPrisma.product.findUnique).toHaveBeenCalled();
    });

    it("debería lanzar error si el producto no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        productService.getById("non-existent-id")
      ).rejects.toThrow("Producto no encontrado");
    });
  });

  describe("create", () => {
    it("debería crear un producto correctamente", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const result = await productService.create({
        nombre: "Producto Test",
        slug: "producto-test",
        categoryId: "test-category-id",
      });

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalled();
    });

    it("debería lanzar error si el slug ya existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        productService.create({
          nombre: "Otro Producto",
          slug: "producto-test",
          categoryId: "test-category-id",
        })
      ).rejects.toThrow("Ya existe un producto con ese slug");
    });

    it("debería lanzar error si la categoría no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        productService.create({
          nombre: "Producto Test",
          slug: "nuevo-slug",
          categoryId: "non-existent-category",
        })
      ).rejects.toThrow("Categoría no encontrada");
    });
  });

  describe("update", () => {
    it("debería actualizar un producto correctamente", async () => {
      mockPrisma.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(null);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        nombre: "Actualizado",
      });

      const result = await productService.update("test-product-id", {
        nombre: "Actualizado",
      });

      expect(result.nombre).toBe("Actualizado");
    });

    it("debería lanzar error si el producto no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        productService.update("non-existent-id", { nombre: "Test" })
      ).rejects.toThrow("Producto no encontrado");
    });

    it("debería lanzar error si el nuevo slug ya existe", async () => {
      mockPrisma.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({ id: "other-id", slug: "nuevo-slug" });

      await expect(
        productService.update("test-product-id", { slug: "nuevo-slug" })
      ).rejects.toThrow("Ya existe un producto con ese slug");
    });

    it("debería lanzar error si la nueva categoría no existe", async () => {
      mockPrisma.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(null);
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        productService.update("test-product-id", { categoryId: "bad-id" })
      ).rejects.toThrow("Categoría no encontrada");
    });
  });

  describe("remove", () => {
    it("debería eliminar un producto correctamente", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      const result = await productService.remove("test-product-id");

      expect(result).toEqual({ message: "Producto eliminado exitosamente" });
    });

    it("debería lanzar error si el producto no existe", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        productService.remove("non-existent-id")
      ).rejects.toThrow("Producto no encontrado");
    });
  });
});
