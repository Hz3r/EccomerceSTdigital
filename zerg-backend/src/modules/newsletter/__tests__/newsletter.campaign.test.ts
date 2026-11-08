import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";

const sendEmail = vi.fn();
vi.mock("../../../utils/email.js", async (orig) => ({
  ...(await orig<typeof import("../../../utils/email.js")>()),
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));
vi.mock("../../settings/settings.service.js", () => ({ get: async () => ({ marca: { nombre: "ZERG" } }) }));

process.env.NEWSLETTER_SEND_DELAY_MS = "0";
const campaign = await import("../newsletter.campaign.js");

const input = { asunto: "Ofertas", mensaje: "Hola\n\nNetflix a S/18 <b>ya</b>", botonTexto: "Ver", botonUrl: "https://tienda.pe/ofertas" };

describe("Envío del boletín", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "secreto-de-prueba";
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "ZERG <hola@tienda.pe>";
    process.env.FRONTEND_URL = "https://tienda.pe";
  });
  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("valida asunto, mensaje y botón", () => {
    expect(() => campaign.parseCampaign({ asunto: "", mensaje: "x" })).toThrow("asunto");
    expect(() => campaign.parseCampaign({ asunto: "a", mensaje: " " })).toThrow("mensaje");
    expect(() => campaign.parseCampaign({ asunto: "a", mensaje: "b", botonTexto: "Ver" })).toThrow("enlace");
    expect(() => campaign.parseCampaign({ asunto: "a", mensaje: "b", botonUrl: "javascript:alert(1)" })).toThrow("http");
    expect(campaign.parseCampaign({ asunto: "a", mensaje: "b", botonUrl: "https://x.pe" }).botonTexto).toBe("Ver más");
  });

  it("la plantilla escapa el HTML del mensaje e incluye el enlace de baja", () => {
    const { html, text } = campaign.renderCampaign(campaign.parseCampaign(input), { marca: "ZERG", nombre: "Ana Pérez", bajaUrl: "https://tienda.pe/boletin/baja?id=1&t=x" });
    expect(html).toContain("Hola Ana,");
    expect(html).toContain("&lt;b&gt;ya&lt;/b&gt;");
    expect(html).not.toContain("<b>ya</b>");
    expect(html).toContain('href="https://tienda.pe/ofertas"');
    expect(html).toContain("Darse de baja");
    expect(text).toContain("Darse de baja: https://tienda.pe/boletin/baja?id=1&t=x");
  });

  it("el enlace de baja va firmado y solo funciona con su firma", async () => {
    const url = new URL(campaign.unsubscribeUrl("sub-1"));
    expect(url.origin + url.pathname).toBe("https://tienda.pe/boletin/baja");
    mockPrisma.subscriber.findUnique.mockResolvedValue({ id: "sub-1", email: "ana@test.com", activo: true });
    mockPrisma.subscriber.update.mockResolvedValue({});

    await expect(campaign.unsubscribe("sub-1", "firma-falsa")).rejects.toThrow("inválido");
    await expect(campaign.unsubscribe("sub-2", url.searchParams.get("t"))).rejects.toThrow("inválido");
    expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();

    await expect(campaign.unsubscribe("sub-1", url.searchParams.get("t"))).resolves.toEqual({ email: "ana@test.com" });
    expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({ where: { id: "sub-1" }, data: { activo: false } });
  });

  it("no envía si el correo no está configurado o no hay suscriptores activos", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(campaign.startCampaign(input)).rejects.toThrow("RESEND_API_KEY");

    process.env.RESEND_API_KEY = "re_test";
    mockPrisma.subscriber.findMany.mockResolvedValue([]);
    await expect(campaign.startCampaign(input)).rejects.toThrow("No hay suscriptores");
    expect(mockPrisma.newsletterCampaign.create).not.toHaveBeenCalled();
  });

  it("envía a cada suscriptor con su enlace de baja y cuenta los fallidos", async () => {
    sendEmail.mockResolvedValueOnce("id1").mockRejectedValueOnce(new Error("rebotado")).mockResolvedValueOnce("id3");
    const recipients = [
      { id: "a", nombre: "Ana", email: "ana@test.com" },
      { id: "b", nombre: "Beto", email: "beto@test.com" },
      { id: "c", nombre: "Caro", email: "caro@test.com" },
    ];

    await campaign.runCampaign("camp-1", campaign.parseCampaign(input), recipients);

    expect(sendEmail).toHaveBeenCalledTimes(3);
    const first = sendEmail.mock.calls[0]![0];
    expect(first.to).toBe("ana@test.com");
    expect(first.headers["List-Unsubscribe"]).toBe(`<${campaign.unsubscribeUrl("a")}>`);
    expect(first.html).toContain("Hola Ana,");
    expect(mockPrisma.newsletterCampaign.update).toHaveBeenLastCalledWith({
      where: { id: "camp-1" },
      data: expect.objectContaining({ enviados: 2, fallidos: 1, estado: "CON_ERRORES" }),
    });
  });

  it("el correo de prueba lleva [Prueba] en el asunto y exige un correo válido", async () => {
    sendEmail.mockResolvedValue("id");
    await expect(campaign.sendTest({ ...input, to: "no-es-correo" })).rejects.toThrow("correo válido");
    await campaign.sendTest({ ...input, to: "Admin@Tienda.pe" });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "admin@tienda.pe", subject: "[Prueba] Ofertas" }));
  });
});
