import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockCategory, mockCategoryUpdate } from "../../../test/fixtures/index.js";
import * as categoryService from "../category.service.js";

describe("Category Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("debería retornar todas las categorías", async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);

      const result = await categoryService.getAll();

      expect(result).toEqual([mockCategory]);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { creadoEn: "desc" },
      });
    });

    it("debería retornar array vacío si no hay categorías", async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      const result = await categoryService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    it("debería retornar una categoría por ID", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      const result = await categoryService.getById("test-category-id");

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: "test-category-id" },
      });
    });

    it("debería lanzar error si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        categoryService.getById("non-existent-id")
      ).rejects.toThrow("Categoría no encontrada");
    });
  });

  describe("create", () => {
    it("debería crear una categoría correctamente", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await categoryService.create({
        nombre: "Categoría Test",
        slug: "categoria-test",
        descripcion: "Una categoría de prueba",
        imagenUrl: "https://example.com/image.jpg",
      });

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          nombre: "Categoría Test",
          slug: "categoria-test",
          descripcion: "Una categoría de prueba",
          imagenUrl: "https://example.com/image.jpg",
        },
      });
    });

    it("debería lanzar error si el slug ya existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      await expect(
        categoryService.create({
          nombre: "Otra Categoría",
          slug: "categoria-test",
        })
      ).rejects.toThrow("Ya existe una categoría con ese slug");
    });
  });

  describe("update", () => {
    it("debería actualizar una categoría correctamente", async () => {
      mockPrisma.category.findUnique
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(null);
      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        ...mockCategoryUpdate,
      });

      const result = await categoryService.update(
        "test-category-id",
        mockCategoryUpdate
      );

      expect(result.nombre).toBe("Categoría Actualizada");
      expect(mockPrisma.category.update).toHaveBeenCalled();
    });

    it("debería lanzar error si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        categoryService.update("non-existent-id", mockCategoryUpdate)
      ).rejects.toThrow("Categoría no encontrada");
    });

    it("debería lanzar error si el nuevo slug ya existe", async () => {
      mockPrisma.category.findUnique
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce({ id: "other-id", slug: "categoria-actualizada" });

      await expect(
        categoryService.update("test-category-id", {
          slug: "categoria-actualizada",
        })
      ).rejects.toThrow("Ya existe una categoría con ese slug");
    });
  });

  describe("remove", () => {
    it("debería eliminar una categoría correctamente", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.category.delete.mockResolvedValue(mockCategory);

      const result = await categoryService.remove("test-category-id");

      expect(result).toEqual({ message: "Categoría eliminada exitosamente" });
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: "test-category-id" },
      });
    });

    it("debería lanzar error si la categoría no existe", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        categoryService.remove("non-existent-id")
      ).rejects.toThrow("Categoría no encontrada");
    });
  });
});
