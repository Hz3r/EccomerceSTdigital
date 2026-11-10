// SEO: dirección pública de la tienda y lectura del catálogo desde el servidor (para el sitemap,
// los títulos de cada página y los datos estructurados que lee Google). Sin "use client".
import type { Product } from "@/types";

/** Dirección pública de la tienda, ej. https://zerg.pe (sin "/" final). Defínela en NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "ZERG";
export const SITE_DESCRIPTION = "Streaming, música, IA y gaming al mejor precio, con entrega inmediata y garantía.";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");
const API_ORIGIN = API_URL.replace(/\/api$/, "");

/** URL absoluta de una imagen subida al backend (/api/uploads/...) o externa. */
export const absoluteAsset = (url?: string | null) => (!url ? undefined : url.startsWith("/api/") ? `${API_ORIGIN}${url}` : url);

/** GET a la API desde el servidor, con caché de `revalidate` segundos. Si falla devuelve null (nunca rompe la página). */
export async function fetchApi<T>(path: string, revalidate = 3600): Promise<T | null> {
  if (!process.env.NEXT_PUBLIC_API_URL) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: T };
    return body.data ?? null;
  } catch {
    return null;
  }
}

/** Texto plano corto para la descripción de una página (sin saltos ni espacios dobles). */
export const metaDescription = (text: string | undefined | null, fallback = SITE_DESCRIPTION) => {
  const clean = (text ?? "").replace(/[*_#>\[\]()]/g, "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 158 ? `${clean.slice(0, 155).replace(/\s+\S*$/, "")}…` : clean;
};

export const activePlanPrices = (p: Product) => (p.plans ?? []).filter((pl) => pl.isActivo !== false).map((pl) => Number(pl.precio)).filter((n) => n > 0);
