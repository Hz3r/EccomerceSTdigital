import type { Plan, Product } from "@/types";

// Google Analytics 4 (gtag.js). El ID se configura en el admin (Analítica); sin ID no se envía nada.
// Eventos de comercio electrónico estándar de GA4 para ver el embudo: ver producto → carrito → pago → compra.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const CURRENCY = "PEN";

/** ID de medición de GA4 válido ("G-XXXXXXX"). Cualquier otra cosa se ignora. */
export function validGoogleId(id?: string | null) {
  const value = (id ?? "").trim().toUpperCase();
  return /^G-[A-Z0-9]{4,20}$/.test(value) ? value : "";
}

/** Envía un evento si Analytics está cargado. Nunca rompe la tienda si falla. */
export function track(event: string, params: Record<string, unknown> = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag("event", event, params);
  } catch {
    // Analytics nunca debe interrumpir una compra
  }
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

/** Producto + plan en el formato de "items" de GA4. */
export function toItem(product: Pick<Product, "slug" | "nombre" | "category">, plan?: Pick<Plan, "nombre" | "precio"> | null, quantity = 1): AnalyticsItem {
  return {
    item_id: product.slug,
    item_name: product.nombre,
    item_category: product.category?.nombre,
    item_variant: plan?.nombre,
    price: Number(plan?.precio ?? 0),
    quantity,
  };
}

export const itemsValue = (items: AnalyticsItem[]) =>
  Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
