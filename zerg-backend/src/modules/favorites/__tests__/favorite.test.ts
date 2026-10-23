import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import * as favoriteService from "../favorite.service.js";

describe("Favoritos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("agregar es idempotente (upsert) y verifica que el producto exista", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: "p1" });
    await expect(favoriteService.add("u1", "p1")).resolves.toEqual({ productId: "p1", favorito: true });
    expect(mockPrisma.favorite.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_productId: { userId: "u1", productId: "p1" } } }));

    mockPrisma.product.findUnique.mockResolvedValue(null);
    await expect(favoriteService.add("u1", "nope")).rejects.toThrow("Producto no encontrado");
  });

  it("quitar solo afecta los favoritos del usuario", async () => {
    await favoriteService.remove("u1", "p1");
    expect(mockPrisma.favorite.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", productId: "p1" } });
  });

  it("la lista solo trae productos activos del usuario", async () => {
    mockPrisma.favorite.findMany.mockResolvedValue([{ product: { id: "p1" } }]);
    await expect(favoriteService.list("u1")).resolves.toEqual([{ id: "p1" }]);
    expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "u1", product: { isActivo: true } } }));
  });
});
