import { BadRequestError } from "../../errors/appError.js";

// Bloques con los que se arma una página de ayuda o una guía. El texto admite un formato simple:
// párrafos separados por una línea en blanco, listas con "- ", **negrita** y [enlaces](https://…).
export type Block =
  | { tipo: "titulo"; texto: string }
  | { tipo: "texto"; texto: string }
  | { tipo: "video"; url: string; titulo: string }
  | { tipo: "imagen"; url: string; alt: string; pie: string }
  | { tipo: "pasos"; items: { titulo: string; texto: string }[] }
  | { tipo: "faq"; titulo: string; items: { pregunta: string; respuesta: string }[] }
  | { tipo: "aviso"; variante: "info" | "alerta" | "exito"; texto: string }
  | { tipo: "boton"; texto: string; url: string };

export const BLOCK_TYPES = ["titulo", "texto", "video", "imagen", "pasos", "faq", "aviso", "boton"] as const;

const MAX_BLOCKS = 80;
const MAX_ITEMS = 30;
const SHORT = 200;
const LONG = 8000;

function text(value: unknown, field: string, max: number, required = false) {
  if (value != null && typeof value !== "string") throw new BadRequestError(`${field} no es válido`);
  const out = (value ?? "").trim();
  if (required && !out) throw new BadRequestError(`${field} no puede estar vacío`);
  if (out.length > max) throw new BadRequestError(`${field}: máximo ${max} caracteres`);
  return out;
}

// Enlaces externos (https) o archivos subidos al backend (/api/uploads/…). Nada de javascript: ni data:.
export function safeUrl(value: unknown, field: string, { required = false, internal = true } = {}) {
  const url = text(value, field, 1000, required);
  if (!url) return "";
  if (url.startsWith("/api/uploads/") && !url.includes("..")) return url;
  if (internal && /^\/(?!\/)[\w\-/?=&.#%]*$/.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch {
    // cae al error de abajo
  }
  throw new BadRequestError(`${field}: escribe un enlace que empiece con https://`);
}

function list<T>(value: unknown, field: string, map: (item: Record<string, unknown>, i: number) => T): T[] {
  if (!Array.isArray(value)) throw new BadRequestError(`${field} debe ser una lista`);
  if (value.length > MAX_ITEMS) throw new BadRequestError(`${field}: máximo ${MAX_ITEMS} elementos`);
  return value.map((item, i) => map((item ?? {}) as Record<string, unknown>, i));
}

function parseBlock(raw: unknown, i: number): Block | null {
  const b = (raw ?? {}) as Record<string, unknown>;
  const n = `Bloque ${i + 1}`;
  switch (b.tipo) {
    case "titulo":
      return { tipo: "titulo", texto: text(b.texto, `${n} (título)`, SHORT, true) };
    case "texto":
      return { tipo: "texto", texto: text(b.texto, `${n} (texto)`, LONG, true) };
    case "video":
      return { tipo: "video", url: safeUrl(b.url, `${n} (video)`, { required: true, internal: false }), titulo: text(b.titulo, `${n} (título del video)`, SHORT) };
    case "imagen":
      return {
        tipo: "imagen",
        url: safeUrl(b.url, `${n} (imagen)`, { required: true, internal: false }),
        alt: text(b.alt, `${n} (descripción)`, SHORT),
        pie: text(b.pie, `${n} (pie de foto)`, SHORT),
      };
    case "pasos": {
      const items = list(b.items, `${n} (pasos)`, (it, j) => ({
        titulo: text(it.titulo, `${n}, paso ${j + 1}`, SHORT),
        texto: text(it.texto, `${n}, paso ${j + 1}`, 1000),
      })).filter((it) => it.titulo || it.texto);
      return items.length ? { tipo: "pasos", items } : null;
    }
    case "faq": {
      const items = list(b.items, `${n} (preguntas)`, (it, j) => ({
        pregunta: text(it.pregunta, `${n}, pregunta ${j + 1}`, 300),
        respuesta: text(it.respuesta, `${n}, respuesta ${j + 1}`, 2000),
      })).filter((it) => it.pregunta && it.respuesta);
      return items.length ? { tipo: "faq", titulo: text(b.titulo, `${n} (título)`, SHORT), items } : null;
    }
    case "aviso": {
      const variante = b.variante === "alerta" || b.variante === "exito" ? b.variante : "info";
      return { tipo: "aviso", variante, texto: text(b.texto, `${n} (aviso)`, 1000, true) };
    }
    case "boton":
      return { tipo: "boton", texto: text(b.texto, `${n} (texto del botón)`, 80, true), url: safeUrl(b.url, `${n} (enlace del botón)`, { required: true }) };
    default:
      throw new BadRequestError(`${n}: tipo de bloque no válido`);
  }
}

/** Valida y limpia los bloques que llegan del panel. Los bloques de lista vacíos se descartan. */
export function parseBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) throw new BadRequestError("El contenido debe ser una lista de bloques");
  if (value.length > MAX_BLOCKS) throw new BadRequestError(`Máximo ${MAX_BLOCKS} bloques por página`);
  return value.map(parseBlock).filter((b): b is Block => b !== null);
}
