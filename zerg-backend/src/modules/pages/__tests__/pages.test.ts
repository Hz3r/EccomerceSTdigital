import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { parseBlocks } from "../page.blocks.js";
import * as pageService from "../page.service.js";
import { PAGE_TEMPLATES } from "../page.templates.js";

const row = (patch: Record<string, unknown> = {}) => ({
  id: "p1",
  slug: "como-pagar-con-yape",
  tipo: "GUIA",
  titulo: "Cómo pagar con Yape",
  resumen: null,
  portadaUrl: null,
  bloques: [{ tipo: "video", url: "https://youtu.be/abc", titulo: "" }],
  publicado: true,
  orden: 0,
  creadoEn: new Date(),
  actualizado: new Date(),
  ...patch,
});

describe("Páginas de ayuda", () => {
  beforeEach(() => vi.clearAllMocks());

  it("las plantillas incluidas son bloques válidos", () => {
    for (const t of PAGE_TEMPLATES) expect(parseBlocks(t.bloques)).toEqual(t.bloques);
  });

  it("valida bloques: rechaza enlaces peligrosos y descarta listas vacías", () => {
    expect(() => parseBlocks([{ tipo: "boton", texto: "x", url: "javascript:alert(1)" }])).toThrow("https://");
    expect(() => parseBlocks([{ tipo: "video", url: "" }])).toThrow("no puede estar vacío");
    expect(() => parseBlocks([{ tipo: "otro" }])).toThrow("tipo de bloque");
    expect(parseBlocks([{ tipo: "pasos", items: [{ titulo: " ", texto: "" }] }, { tipo: "texto", texto: " Hola " }])).toEqual([{ tipo: "texto", texto: "Hola" }]);
    expect(parseBlocks([{ tipo: "imagen", url: "/api/uploads/general/a.png" }])).toEqual([{ tipo: "imagen", url: "/api/uploads/general/a.png", alt: "", pie: "" }]);
  });

  it("una página fija sin personalizar muestra la plantilla", async () => {
    mockPrisma.page.findUnique.mockResolvedValue(null);
    const page = await pageService.getBySlug("garantia");
    expect(page).toMatchObject({ slug: "garantia", titulo: "Garantía y reemplazos", plantilla: true });
    await expect(pageService.getBySlug("no-existe")).rejects.toThrow("Página no encontrada");
  });

  it("una guía sin publicar solo la ve el admin", async () => {
    mockPrisma.page.findUnique.mockResolvedValue(row({ publicado: false }));
    await expect(pageService.getBySlug("como-pagar-con-yape")).rejects.toThrow("Página no encontrada");
    await expect(pageService.getBySlug("como-pagar-con-yape", { admin: true })).resolves.toMatchObject({ titulo: "Cómo pagar con Yape" });
  });

  it("guardar una página fija la personaliza y restaurar vuelve a la plantilla", async () => {
    mockPrisma.page.upsert.mockImplementation(async ({ create }: { create: Record<string, unknown> }) => row(create));
    const saved = await pageService.saveFixed("terminos", { titulo: "Términos", bloques: [{ tipo: "texto", texto: "Hola" }] });
    expect(mockPrisma.page.upsert.mock.calls[0]![0]).toMatchObject({ where: { slug: "terminos" }, create: { tipo: "PAGINA", publicado: true } });
    expect(saved.plantilla).toBe(false);
    await expect(pageService.saveFixed("otra", { titulo: "x", bloques: [] })).rejects.toThrow("no encontrada");

    const restored = await pageService.restoreFixed("terminos");
    expect(mockPrisma.page.deleteMany).toHaveBeenCalledWith({ where: { slug: "terminos", tipo: "PAGINA" } });
    expect(restored.plantilla).toBe(true);
  });

  it("una guía nueva recibe un enlace único que no choca con las páginas fijas", async () => {
    mockPrisma.page.findUnique.mockImplementation(async ({ where }: { where: { slug: string } }) => (where.slug === "como-pagar" ? { id: "otro" } : null));
    mockPrisma.page.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => row(data));

    const guide = await pageService.createGuide({ titulo: "¿Cómo pagar?" });
    expect(guide.slug).toBe("como-pagar-2");
    expect(guide.bloques.length).toBeGreaterThan(0);
    expect(mockPrisma.page.create.mock.calls[0]![0].data).toMatchObject({ tipo: "GUIA", publicado: false });

    await pageService.createGuide({ titulo: "Garantía" });
    expect(mockPrisma.page.create.mock.calls[1]![0].data.slug).toBe("garantia-2");
  });

  it("la lista de guías indica cuáles tienen video", async () => {
    mockPrisma.page.findMany.mockResolvedValue([row(), row({ id: "p2", slug: "b", bloques: [{ tipo: "texto", texto: "x" }] })]);
    const list = await pageService.listGuides();
    expect(list.map((g) => g.video)).toEqual([true, false]);
    expect(mockPrisma.page.findMany.mock.calls[0]![0].where).toEqual({ tipo: "GUIA", publicado: true });
  });
});
