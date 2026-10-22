import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHash } from "crypto";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import * as supportService from "../support.service.js";

const conversation = (patch: Record<string, unknown> = {}) => ({
  id: "conv-1",
  tema: "Mi pedido",
  nombre: "Ana",
  email: null,
  telefono: null,
  estado: "ABIERTA",
  userId: null,
  tokenHash: "x",
  noLeidasAdmin: 0,
  noLeidasCliente: 0,
  creadoEn: new Date(),
  ...patch,
});
const notified = () => mockPrisma.notification.create.mock.calls.map(([arg]) => arg.data);

describe("Chat de soporte", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.message.create.mockResolvedValue({ id: "m1", autor: "CLIENTE", texto: "hola", creadoEn: new Date() });
  });

  it("un visitante inicia un chat: se guarda solo el hash del token y se avisa al admin", async () => {
    mockPrisma.conversation.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => conversation(data));

    const result = await supportService.start(undefined, { tema: "Pagos", nombre: " Ana ", mensaje: "¿Aceptan Plin?" });

    const saved = mockPrisma.conversation.create.mock.calls[0]![0].data;
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.tokenHash).toBe(createHash("sha256").update(result.token).digest("hex"));
    expect(saved).not.toHaveProperty("token");
    expect(saved).toMatchObject({ tema: "Pagos", nombre: "Ana", messages: { create: { autor: "CLIENTE", texto: "¿Aceptan Plin?" } } });
    expect(notified()).toEqual([expect.objectContaining({ audiencia: "ADMIN", tipo: "MENSAJE", titulo: "Nuevo chat de soporte" })]);
  });

  it("valida tema, nombre y mensaje", async () => {
    await expect(supportService.start(undefined, { tema: "Hackeo", nombre: "A", mensaje: "x" })).rejects.toThrow("Elige un tema");
    await expect(supportService.start(undefined, { tema: "Otro", mensaje: "x" })).rejects.toThrow("Escribe tu nombre");
    await expect(supportService.start(undefined, { tema: "Otro", nombre: "A", mensaje: "  " })).rejects.toThrow("vacío");
    await expect(supportService.start(undefined, { tema: "Otro", nombre: "A", mensaje: "x".repeat(1001) })).rejects.toThrow("1000");
  });

  it("sin token válido no se puede escribir en un chat ajeno", async () => {
    mockPrisma.conversation.findUnique.mockResolvedValue(null);
    await expect(supportService.send(undefined, "f".repeat(64), { texto: "hola" })).rejects.toThrow("No encontramos tu chat");
    expect(mockPrisma.message.create).not.toHaveBeenCalled();
  });

  it("con su token el visitante escribe y el chat suma un no leído para el admin", async () => {
    mockPrisma.conversation.findUnique.mockResolvedValue(conversation());
    await supportService.send(undefined, "a".repeat(64), { texto: "¿Ya enviaron mi acceso?" });

    expect(mockPrisma.conversation.findUnique).toHaveBeenCalledWith({ where: { tokenHash: createHash("sha256").update("a".repeat(64)).digest("hex") } });
    expect(mockPrisma.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: "ABIERTA", noLeidasAdmin: { increment: 1 } }) })
    );
  });

  it("la respuesta del admin avisa al cliente con cuenta", async () => {
    mockPrisma.conversation.findUnique.mockResolvedValue(conversation({ userId: "cliente-1" }));
    mockPrisma.message.create.mockResolvedValue({ id: "m2", autor: "ADMIN", texto: "¡Ya está!", creadoEn: new Date() });

    await supportService.reply("conv-1", { texto: "¡Ya está!" });

    expect(mockPrisma.message.create).toHaveBeenCalledWith(expect.objectContaining({ data: { conversationId: "conv-1", autor: "ADMIN", texto: "¡Ya está!" } }));
    expect(notified()).toEqual([expect.objectContaining({ audiencia: "CLIENTE", userId: "cliente-1", titulo: "Soporte te respondió" })]);
  });
});
