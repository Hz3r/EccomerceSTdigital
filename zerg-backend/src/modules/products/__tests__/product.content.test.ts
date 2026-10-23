import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { parseProductContent } from "../product.content.js";

describe("Contenido del producto", () => {
  it("limpia textos y descarta filas vacías", () => {
    const result = parseProductContent({
      incluye: ["  Perfil privado  ", "", "Soporte 24/7"],
      pasos: [{ titulo: "Compra", texto: "Elige tu plan" }, { titulo: "", texto: "" }],
      faqs: [{ pregunta: "¿Es legal?", respuesta: "Sí." }, { pregunta: "Sin respuesta", respuesta: "" }],
    });
    expect(result.incluye).toEqual(["Perfil privado", "Soporte 24/7"]);
    expect(result.pasos).toEqual([{ titulo: "Compra", texto: "Elige tu plan" }]);
    expect(result.faqs).toEqual([{ pregunta: "¿Es legal?", respuesta: "Sí." }]);
  });

  it("una lista vacía vuelve a los textos generales (null) y una clave ausente no se toca", () => {
    const result = parseProductContent({ faqs: [], incluye: null });
    expect(result.faqs).toBe(Prisma.JsonNull);
    expect(result.incluye).toBe(Prisma.JsonNull);
    expect(result.pasos).toBeUndefined();
  });

  it("rechaza formatos o tamaños inválidos", () => {
    expect(() => parseProductContent({ incluye: "texto" })).toThrow("debe ser una lista");
    expect(() => parseProductContent({ pasos: Array(7).fill({ titulo: "a", texto: "b" }) })).toThrow("máximo 6");
    expect(() => parseProductContent({ faqs: [{ pregunta: "x".repeat(161), respuesta: "y" }] })).toThrow("máximo 160");
  });
});
