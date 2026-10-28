import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { mockOrder, mockPlan } from "../../../test/fixtures/index.js";
import * as orderService from "../order.service.js";

const client = { userId: "cliente-1", email: "c@test.com", rol: "CLIENTE" as const };
const admin = { userId: "admin-1", email: "a@test.com", rol: "ADMIN" as const };
const ownOrder = { ...mockOrder, userId: "cliente-1" };

const notificationsCreated = () => mockPrisma.notification.create.mock.calls.map(([arg]) => arg.data);

describe("Órdenes: cada cliente solo ve las suyas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getMine filtra por el usuario de la sesión", async () => {
    mockPrisma.order.findMany.mockResolvedValue([ownOrder]);
    await orderService.getMine("cliente-1");
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "cliente-1" } }));
  });

  it("un cliente ve su propia orden", async () => {
    mockPrisma.order.findUnique.mockResolvedValue(ownOrder);
    await expect(orderService.getById("test-order-id", client)).resolves.toEqual(ownOrder);
  });

  it("un cliente no puede ver la orden de otro (responde no encontrada)", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, userId: "otro-cliente" });
    await expect(orderService.getById("test-order-id", client)).rejects.toThrow("Orden no encontrada");
  });

  it("un admin puede ver cualquier orden", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...mockOrder, userId: "otro-cliente" });
    await expect(orderService.getById("test-order-id", admin)).resolves.toBeTruthy();
  });
});

describe("Órdenes: notificaciones", () => {
  beforeEach(() => vi.clearAllMocks());

  it("una compra avisa al admin (COMPRA) y al cliente (PEDIDO)", async () => {
    mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
    mockPrisma.order.create.mockResolvedValue(ownOrder);

    await orderService.create({ nombreCliente: "Juan", email: "j@test.com", userId: "cliente-1", items: [{ planId: "p", cantidad: 1 }] });

    expect(notificationsCreated()).toEqual([
      expect.objectContaining({ audiencia: "ADMIN", tipo: "COMPRA", titulo: "Nueva orden de compra", orderId: ownOrder.id }),
      expect.objectContaining({ audiencia: "CLIENTE", userId: "cliente-1", tipo: "PEDIDO", titulo: "Recibimos tu pedido" }),
    ]);
  });

  it("completar una orden avisa al cliente y registra la venta para el admin (VENTA)", async () => {
    mockPrisma.order.findUnique.mockResolvedValue(ownOrder);
    mockPrisma.order.update.mockResolvedValue({ ...ownOrder, status: "COMPLETADO" });

    await orderService.updateStatus("test-order-id", "COMPLETADO");

    expect(notificationsCreated()).toEqual([
      expect.objectContaining({ audiencia: "CLIENTE", userId: "cliente-1", tipo: "PEDIDO", titulo: "Pedido completado" }),
      expect.objectContaining({ audiencia: "ADMIN", tipo: "VENTA", titulo: "Venta completada" }),
    ]);
  });

  it("no avisa si el estado no cambia", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...ownOrder, status: "ENVIADO" });
    mockPrisma.order.update.mockResolvedValue({ ...ownOrder, status: "ENVIADO" });

    await orderService.updateStatus("test-order-id", "ENVIADO");

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("si la notificación falla, la compra se crea igual", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
    mockPrisma.order.create.mockResolvedValue(ownOrder);
    mockPrisma.notification.create.mockRejectedValueOnce(new Error("db"));

    await expect(
      orderService.create({ nombreCliente: "Juan", email: "j@test.com", userId: "cliente-1", items: [{ planId: "p", cantidad: 1 }] })
    ).resolves.toEqual(ownOrder);
  });
});
