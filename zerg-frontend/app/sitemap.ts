import type { MetadataRoute } from "next";
import { SITE_URL, fetchApi } from "@/lib/seo";
import type { Category, Product } from "@/types";

const HELP = ["como-comprar", "preguntas-frecuentes", "garantia", "terminos", "privacidad"];

// Se regenera cada hora: los productos, categorías y guías nuevas aparecen solos.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, guides] = await Promise.all([
    fetchApi<Product[]>("/products"),
    fetchApi<Category[]>("/categories"),
    fetchApi<{ slug: string; actualizado: string }[]>("/pages/guias"),
  ]);
  const now = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...(categories ?? []).map((c) => ({
      url: `${SITE_URL}/products?categoria=${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(products ?? [])
      .filter((p) => p.isActivo !== false)
      .map((p) => ({
        url: `${SITE_URL}/product/${encodeURIComponent(p.slug)}`,
        lastModified: p.actualizado ? new Date(p.actualizado) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ...HELP.map((slug) => ({ url: `${SITE_URL}/ayuda/${slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.4 })),
    ...(guides ?? []).map((g) => ({
      url: `${SITE_URL}/ayuda/como-comprar/${encodeURIComponent(g.slug)}`,
      lastModified: g.actualizado ? new Date(g.actualizado) : now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
