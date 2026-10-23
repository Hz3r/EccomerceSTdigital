import { Prisma } from "@prisma/client";
import { BadRequestError } from "../../errors/appError.js";

// Contenido propio de cada producto en su página: "Qué incluye", "Cómo funciona" y "Preguntas frecuentes".
// Una lista vacía guarda null y la tienda usa los textos generales.

const LIMITS = { incluye: 10, pasos: 6, faqs: 15 } as const;
const MAX_SHORT = 160;
const MAX_LONG = 600;

const text = (value: unknown, max: number, field: string) => {
  if (typeof value !== "string") throw new BadRequestError(`${field}: debe ser texto`);
  const clean = value.trim();
  if (clean.length > max) throw new BadRequestError(`${field}: máximo ${max} caracteres`);
  return clean;
};

function list<T>(value: unknown, key: keyof typeof LIMITS, map: (item: unknown, i: number) => T | null) {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  if (!Array.isArray(value)) throw new BadRequestError(`${key}: debe ser una lista`);
  if (value.length > LIMITS[key]) throw new BadRequestError(`${key}: máximo ${LIMITS[key]} elementos`);
  const items = value.map(map).filter((x): x is T => x !== null);
  return items.length ? (items as Prisma.InputJsonValue) : Prisma.JsonNull;
}

const obj = (item: unknown) => (typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {});

/** Valida el contenido enviado desde el admin. Las claves ausentes no se tocan. */
export function parseProductContent(body: Record<string, unknown>) {
  return {
    incluye: list(body.incluye, "incluye", (item, i) => text(item, MAX_SHORT, `Qué incluye ${i + 1}`) || null),
    pasos: list(body.pasos, "pasos", (item, i) => {
      const titulo = text(obj(item).titulo ?? "", MAX_SHORT, `Paso ${i + 1}`);
      const texto = text(obj(item).texto ?? "", MAX_LONG, `Paso ${i + 1}`);
      return titulo || texto ? { titulo, texto } : null;
    }),
    faqs: list(body.faqs, "faqs", (item, i) => {
      const pregunta = text(obj(item).pregunta ?? "", MAX_SHORT, `Pregunta ${i + 1}`);
      const respuesta = text(obj(item).respuesta ?? "", MAX_LONG, `Respuesta ${i + 1}`);
      return pregunta && respuesta ? { pregunta, respuesta } : null;
    }),
  };
}
