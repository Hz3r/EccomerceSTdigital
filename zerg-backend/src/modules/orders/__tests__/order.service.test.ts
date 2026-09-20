import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockOrder, mockPlan } from "../../../test/fixtures/index.js";
import * as orderService from "../order.service.js";

describe("Order Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("debería retornar todas las órdenes con items y usuario", async () => {
      const orderFull = {
        ...mockOrder,
        items: [{ id: "item-1", plan: { id: mockPlan.id, nombre: mockPlan.nombre, precio: mockPlan.precio } }],
        user: { id: "user-1", nombre: "Test", email: "test@test.com" },
      };
      mockPrisma.order.findMany.mockResolvedValue([orderFull]);

      const result = await orderService.getAll();

      expect(result).toEqual([orderFull]);
      expect(mockPrisma.order.findMany).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("debería retornar una orden por ID", async () => {
      const orderFull = {
        ...mockOrder,
        items: [],
        user: { id: "user-1", nombre: "Test", email: "test@test.com" },
      };
      mockPrisma.order.findUnique.mockResolvedValue(orderFull);

      const result = await orderService.getById("test-order-id");

      expect(result).toEqual(orderFull);
    });

    it("debería lanzar error si la orden no existe", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(orderService.getById("non-existent-id")).rejects.toThrow("Orden no encontrada");
    });
  });

  describe("create", () => {
    it("debería crear una orden correctamente", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const result = await orderService.create({
        nombreCliente: "Juan Pérez",
        email: "juan@test.com",
        items: [{ planId: "test-plan-id", cantidad: 1 }],
      });

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.order.create).toHaveBeenCalled();
    });

    it("debería lanzar error si no hay items", async () => {
      await expect(
        orderService.create({
          nombreCliente: "Juan Pérez",
          email: "juan@test.com",
          items: [],
        })
      ).rejects.toThrow("La orden debe tener al menos un item");
    });

    it("debería lanzar error si el plan no existe", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      await expect(
        orderService.create({
          nombreCliente: "Juan Pérez",
          email: "juan@test.com",
          items: [{ planId: "non-existent-plan", cantidad: 1 }],
        })
      ).rejects.toThrow("Plan no encontrado");
    });

    it("debería lanzar error si el plan está inactivo", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue({ ...mockPlan, isActivo: false });

      await expect(
        orderService.create({
          nombreCliente: "Juan Pérez",
          email: "juan@test.com",
          items: [{ planId: "test-plan-id", cantidad: 1 }],
        })
      ).rejects.toThrow("Plan inactivo");
    });
  });

  describe("updateStatus", () => {
    it("debería actualizar el estado de una orden", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: "ENVIADO" });

      const result = await orderService.updateStatus("test-order-id", "ENVIADO");

      expect(result.status).toBe("ENVIADO");
    });

    it("debería lanzar error si la orden no existe", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        orderService.updateStatus("non-existent-id", "ENVIADO")
      ).rejects.toThrow("Orden no encontrada");
    });
  });

  describe("remove", () => {
    it("debería eliminar una orden y sus items", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.orderItem.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.order.delete.mockResolvedValue(mockOrder);

      const result = await orderService.remove("test-order-id");

      expect(result).toEqual({ message: "Orden eliminada exitosamente" });
      expect(mockPrisma.orderItem.deleteMany).toHaveBeenCalledWith({
        where: { orderId: "test-order-id" },
      });
    });

    it("debería lanzar error si la orden no existe", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(orderService.remove("non-existent-id")).rejects.toThrow("Orden no encontrada");
    });
  });
});
