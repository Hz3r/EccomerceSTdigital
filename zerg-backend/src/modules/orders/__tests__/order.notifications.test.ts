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

  it("crear una orden no avisa a nadie: es una reserva hasta que llega el pago", async () => {
    mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
    mockPrisma.order.create.mockResolvedValue(ownOrder);

    await orderService.create({ nombreCliente: "Juan", email: "j@test.com", telefono: "987654321", userId: "cliente-1", items: [{ planId: "p", cantidad: 1 }] });

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
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

});

describe("Órdenes: una sola orden sin pagar por cuenta", () => {
  beforeEach(() => vi.clearAllMocks());
  const input = { nombreCliente: "Juan", email: "j@test.com", telefono: "987654321", userId: "cliente-1", items: [{ planId: "p", cantidad: 1 }] };

  it("no deja crear otra orden si hay una sin pagar e indica cuál es", async () => {
    mockPrisma.order.findFirst.mockResolvedValueOnce({ numeroOrden: "ORD-1", total: 20 });

    const error = await orderService.create(input).catch((e) => e);

    expect(error).toMatchObject({ statusCode: 409, data: { code: "PENDING_ORDER", numeroOrden: "ORD-1", total: 20 } });
    expect(mockPrisma.order.create).not.toHaveBeenCalled();
    // Solo cuentan las pendientes sin comprobante en revisión ni pago confirmado
    expect(mockPrisma.order.findFirst.mock.calls[0]![0].where).toEqual({
      userId: "cliente-1",
      status: "PENDIENTE",
      payments: { some: {}, none: { estado: { in: ["EN_REVISION", "PAGADO"] } } },
    });
  });

  it("el cliente cancela su orden sin pagar: se elimina y devuelve los productos para el carrito", async () => {
    mockPrisma.order.findFirst.mockResolvedValueOnce({
      id: "o1",
      status: "PENDIENTE",
      items: [{ planId: "plan-1", cantidad: 2 }],
      payments: [{ estado: "PENDIENTE", comprobante: null }],
    });

    const result = await orderService.cancelUnpaid("cliente-1", "ORD-1");

    expect(mockPrisma.order.findFirst.mock.calls[0]![0].where).toEqual({ numeroOrden: "ORD-1", userId: "cliente-1" });
    expect(mockPrisma.orderItem.deleteMany).toHaveBeenCalledWith({ where: { orderId: "o1" } });
    expect(mockPrisma.order.delete).toHaveBeenCalledWith({ where: { id: "o1" } });
    expect(result).toEqual({ numeroOrden: "ORD-1", items: [{ planId: "plan-1", cantidad: 2 }] });
  });

  it("no se puede cancelar una orden con el pago en revisión, ni una ajena", async () => {
    mockPrisma.order.findFirst.mockResolvedValueOnce({ id: "o1", status: "PENDIENTE", items: [], payments: [{ estado: "EN_REVISION", comprobante: "x.png" }] });
    await expect(orderService.cancelUnpaid("cliente-1", "ORD-1")).rejects.toMatchObject({ statusCode: 409 });

    // Orden antigua sin intentos de pago (antes del módulo de pagos): no se borra
    mockPrisma.order.findFirst.mockResolvedValueOnce({ id: "o0", status: "PENDIENTE", items: [], payments: [] });
    await expect(orderService.cancelUnpaid("cliente-1", "ORD-0")).rejects.toMatchObject({ statusCode: 409 });

    mockPrisma.order.findFirst.mockResolvedValueOnce(null);
    await expect(orderService.cancelUnpaid("cliente-1", "ORD-2")).rejects.toThrow("Orden no encontrada");
    expect(mockPrisma.order.delete).not.toHaveBeenCalled();
  });
});
