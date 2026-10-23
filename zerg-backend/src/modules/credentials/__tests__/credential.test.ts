import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { decrypt, encrypt } from "../../../utils/crypto.js";
import * as credentialService from "../credential.service.js";

const order = (patch: Record<string, unknown> = {}) => ({
  id: "ord-1",
  numeroOrden: "ORD-1",
  nombreCliente: "Ana Pérez",
  email: "ana@test.com",
  telefono: "987654321",
  status: "PENDIENTE",
  userId: "user-1",
  items: [
    {
      id: "item-1",
      cantidad: 1,
      plan: { nombre: "1 mes", duracion: "30 días", product: { nombre: "Netflix", slug: "netflix", imagenUrl: null } },
      credential: {
        id: "cred-1",
        datos: encrypt(JSON.stringify({ usuario: "ana@netflix.com", contrasena: "Secreta123", perfil: "Ana" })),
        venceEn: null,
        publicadoEn: null,
        enviadoCorreoEn: null,
        enviadoWhatsappEn: null,
        vistoEn: null,
        actualizado: new Date(),
      },
    },
    { id: "item-2", cantidad: 1, plan: { nombre: "Anual", duracion: "1 año", product: { nombre: "Canva", slug: "canva", imagenUrl: null } }, credential: null },
  ],
  ...patch,
});

describe("Credenciales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("se guardan cifradas (nunca en texto plano)", async () => {
    mockPrisma.orderItem.findUnique.mockResolvedValue({ id: "item-1" });
    mockPrisma.credential.upsert.mockImplementation(async ({ create }: { create: Record<string, unknown> }) => ({ id: "cred-1", actualizado: new Date(), ...create }));

    const result = await credentialService.save("item-1", { datos: { usuario: " ana@netflix.com ", contrasena: "Secreta123", pin: "" }, venceEn: "2026-12-01" });

    const stored = mockPrisma.credential.upsert.mock.calls[0]![0].create.datos as string;
    expect(stored).not.toContain("Secreta123");
    expect(JSON.parse(decrypt(stored))).toEqual({ usuario: "ana@netflix.com", contrasena: "Secreta123" });
    expect(result.datos).toEqual({ usuario: "ana@netflix.com", contrasena: "Secreta123" });
  });

  it("rechaza credenciales vacías", async () => {
    mockPrisma.orderItem.findUnique.mockResolvedValue({ id: "item-1" });
    await expect(credentialService.save("item-1", { datos: { usuario: "  " } })).rejects.toThrow("al menos un dato");
  });

  it("enviar por la web las publica, avisa al cliente y marca el pedido como enviado", async () => {
    mockPrisma.order.findUnique.mockResolvedValue(order());

    const { results, pendientes } = await credentialService.send("ord-1", ["WEB"]);

    expect(results).toEqual([{ canal: "WEB", ok: true, mensaje: "Publicado en Mis accesos" }]);
    expect(pendientes).toBe(1);
    expect(mockPrisma.credential.updateMany).toHaveBeenCalledWith({ where: { id: { in: ["cred-1"] } }, data: { publicadoEn: expect.any(Date) } });
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: "user-1", href: "/account?tab=accesos" }) });
    expect(mockPrisma.order.update).toHaveBeenCalledWith({ where: { id: "ord-1" }, data: { status: "ENVIADO" } });
  });

  it("cada canal es independiente: si el correo no está configurado la web igual se envía", async () => {
    mockPrisma.order.findUnique.mockResolvedValue(order());
    const { results } = await credentialService.send("ord-1", ["EMAIL", "WEB"]);
    expect(results.map((r) => [r.canal, r.ok])).toEqual([
      ["EMAIL", false],
      ["WEB", true],
    ]);
  });

  it("envía el correo por Resend con los datos del acceso", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "ZERG <accesos@zerg.pe>";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "email-1" }) });
    vi.stubGlobal("fetch", fetchMock);
    mockPrisma.order.findUnique.mockResolvedValue(order({ status: "ENVIADO" }));

    const { results } = await credentialService.send("ord-1", ["EMAIL"]);

    expect(results[0]).toMatchObject({ canal: "EMAIL", ok: true });
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body).toMatchObject({ to: ["ana@test.com"], subject: "Tus accesos del pedido ORD-1" });
    expect(body.html).toContain("Secreta123");
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it("sin credenciales guardadas no envía nada", async () => {
    mockPrisma.order.findUnique.mockResolvedValue(order({ items: [] }));
    await expect(credentialService.send("ord-1", ["WEB"])).rejects.toThrow("Primero guarda");
  });

  it("el texto para WhatsApp incluye cada acceso", () => {
    const text = credentialService.buildText("Ana", "ORD-1", [{ titulo: "Netflix · 1 mes", datos: { usuario: "u", contrasena: "p" }, venceEn: null }]);
    expect(text).toContain("*Netflix · 1 mes*\nUsuario / correo: u\nContraseña: p");
  });

  it("el cliente solo consulta accesos publicados de sus pedidos", async () => {
    mockPrisma.credential.findMany.mockResolvedValue([]);
    await credentialService.mine("user-1");
    expect(mockPrisma.credential.findMany.mock.calls[0]![0].where).toEqual({ publicadoEn: { not: null }, orderItem: { order: { userId: "user-1" } } });
  });
});
