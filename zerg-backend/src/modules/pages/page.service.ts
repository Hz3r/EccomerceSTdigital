import type { Page, Prisma } from "@prisma/client";
import { getPrisma } from "../../config/database.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../errors/appError.js";
import { emit } from "../../realtime/events.js";
import { parseBlocks, safeUrl, type Block } from "./page.blocks.js";
import { FIXED_SLUGS, GUIDE_STARTER, templateFor } from "./page.templates.js";

const MAX_GUIDES = 100;
// Rutas de la API que no pueden ser el enlace de una guía
const RESERVED = ["admin", "guias"];

export interface PublicPage {
  id: string | null;
  slug: string;
  tipo: "PAGINA" | "GUIA";
  titulo: string;
  resumen: string;
  portadaUrl: string;
  bloques: Block[];
  publicado: boolean;
  orden: number;
  actualizado: Date | null;
  // Para el admin: true si es una página fija que todavía muestra la plantilla incluida
  plantilla: boolean;
}

const present = (p: Page): PublicPage => ({
  id: p.id,
  slug: p.slug,
  tipo: p.tipo,
  titulo: p.titulo,
  resumen: p.resumen ?? "",
  portadaUrl: p.portadaUrl ?? "",
  bloques: (Array.isArray(p.bloques) ? p.bloques : []) as Block[],
  publicado: p.publicado,
  orden: p.orden,
  actualizado: p.actualizado,
  plantilla: false,
});

function fromTemplate(slug: string): PublicPage | null {
  const t = templateFor(slug);
  if (!t) return null;
  return { id: null, slug, tipo: "PAGINA", titulo: t.titulo, resumen: t.resumen, portadaUrl: "", bloques: t.bloques, publicado: true, orden: 0, actualizado: null, plantilla: true };
}

// Hay videos en la guía: la tienda lo indica en la tarjeta del blog.
const hasVideo = (bloques: unknown) => Array.isArray(bloques) && bloques.some((b) => (b as { tipo?: string })?.tipo === "video");

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ==================== Tienda ====================

/** Página para la tienda: la personalizada, o la plantilla si es fija. Las guías sin publicar solo las ve el admin. */
export async function getBySlug(slug: string, { admin = false } = {}) {
  const page = await getPrisma().page.findUnique({ where: { slug } });
  if (page && (page.publicado || admin)) return present(page);
  const template = fromTemplate(slug);
  if (template) return template;
  throw new NotFoundError("Página no encontrada");
}

/** Guías publicadas del blog "¿Cómo comprar?", en el orden que elige el admin. */
export async function listGuides({ admin = false } = {}) {
  const guides = await getPrisma().page.findMany({
    where: { tipo: "GUIA", ...(admin ? {} : { publicado: true }) },
    orderBy: [{ orden: "asc" }, { creadoEn: "desc" }],
    take: MAX_GUIDES,
  });
  return guides.map(({ bloques, ...g }) => ({
    id: g.id,
    slug: g.slug,
    titulo: g.titulo,
    resumen: g.resumen ?? "",
    portadaUrl: g.portadaUrl ?? "",
    publicado: g.publicado,
    orden: g.orden,
    actualizado: g.actualizado,
    video: hasVideo(bloques),
  }));
}

// ==================== Admin ====================

/** Páginas fijas (con su estado: plantilla o personalizada) y todas las guías. */
export async function adminOverview() {
  const custom = await getPrisma().page.findMany({ where: { tipo: "PAGINA", slug: { in: FIXED_SLUGS } }, select: { slug: true, titulo: true, actualizado: true } });
  const fijas = FIXED_SLUGS.map((slug) => {
    const saved = custom.find((c) => c.slug === slug);
    return { slug, titulo: saved?.titulo ?? templateFor(slug)!.titulo, plantilla: !saved, actualizado: saved?.actualizado ?? null };
  });
  return { fijas, guias: await listGuides({ admin: true }) };
}

function parseCommon(input: Record<string, unknown>) {
  const titulo = typeof input.titulo === "string" ? input.titulo.trim() : "";
  if (!titulo) throw new BadRequestError("Escribe un título");
  if (titulo.length > 120) throw new BadRequestError("El título admite máximo 120 caracteres");
  const resumen = typeof input.resumen === "string" ? input.resumen.trim() : "";
  if (resumen.length > 300) throw new BadRequestError("El resumen admite máximo 300 caracteres");
  return {
    titulo,
    resumen: resumen || null,
    portadaUrl: safeUrl(input.portadaUrl, "Portada", { internal: false }) || null,
    bloques: parseBlocks(input.bloques) as unknown as Prisma.InputJsonValue,
  };
}

/** Guarda una página fija (Cómo comprar, FAQ, Garantía, Términos, Privacidad). Siempre está publicada. */
export async function saveFixed(slug: string, input: Record<string, unknown>) {
  if (!FIXED_SLUGS.includes(slug)) throw new NotFoundError("Página no encontrada");
  const data = parseCommon(input);
  const page = await getPrisma().page.upsert({
    where: { slug },
    create: { slug, tipo: "PAGINA", publicado: true, ...data },
    update: data,
  });
  emit("pages");
  return present(page);
}

/** Vuelve a la plantilla incluida (borra la versión personalizada). */
export async function restoreFixed(slug: string) {
  if (!FIXED_SLUGS.includes(slug)) throw new NotFoundError("Página no encontrada");
  await getPrisma().page.deleteMany({ where: { slug, tipo: "PAGINA" } });
  emit("pages");
  return fromTemplate(slug)!;
}

async function uniqueSlug(base: string, exceptId?: string) {
  const root = slugify(base) || "guia";
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? root : `${root}-${i}`;
    if (FIXED_SLUGS.includes(slug) || RESERVED.includes(slug)) continue;
    const taken = await getPrisma().page.findUnique({ where: { slug }, select: { id: true } });
    if (!taken || taken.id === exceptId) return slug;
  }
  throw new ConflictError("Ya existe una guía con ese enlace");
}

export async function createGuide(input: Record<string, unknown>) {
  const count = await getPrisma().page.count({ where: { tipo: "GUIA" } });
  if (count >= MAX_GUIDES) throw new BadRequestError(`Máximo ${MAX_GUIDES} guías`);
  const data = parseCommon({ ...input, bloques: input.bloques ?? GUIDE_STARTER });
  const slug = await uniqueSlug(typeof input.slug === "string" && input.slug.trim() ? input.slug : data.titulo);
  const page = await getPrisma().page.create({
    data: { ...data, slug, tipo: "GUIA", publicado: input.publicado === true, orden: count },
  });
  emit("pages");
  return present(page);
}

async function findGuide(id: string) {
  const page = await getPrisma().page.findUnique({ where: { id } });
  if (!page || page.tipo !== "GUIA") throw new NotFoundError("Guía no encontrada");
  return page;
}

export async function updateGuide(id: string, input: Record<string, unknown>) {
  const current = await findGuide(id);
  const data = parseCommon(input);
  const wanted = typeof input.slug === "string" && input.slug.trim() ? input.slug : current.slug;
  const slug = slugify(wanted) === current.slug ? current.slug : await uniqueSlug(wanted, id);
  const page = await getPrisma().page.update({
    where: { id },
    data: { ...data, slug, ...(typeof input.publicado === "boolean" && { publicado: input.publicado }) },
  });
  emit("pages");
  return present(page);
}

export async function removeGuide(id: string) {
  await findGuide(id);
  await getPrisma().page.delete({ where: { id } });
  emit("pages");
  return { id };
}

/** Nuevo orden de las guías (lista de ids, la primera va arriba). */
export async function reorderGuides(ids: unknown) {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new BadRequestError("Orden no válido");
  await getPrisma().$transaction(
    (ids as string[]).map((id, orden) => getPrisma().page.updateMany({ where: { id, tipo: "GUIA" }, data: { orden } }))
  );
  emit("pages");
  return listGuides({ admin: true });
}
