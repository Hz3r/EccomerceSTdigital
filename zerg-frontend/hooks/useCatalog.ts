"use client";

import { useEffect, useState } from "react";
import { getCategories, getProducts } from "@/lib/api";
import { useLiveVersion } from "@/lib/live";
import type { Category, Product } from "@/types";

interface CatalogData {
  products: Product[];
  categories: Category[];
}

// Caché en memoria compartida por la página de productos y el buscador: al cambiar de categoría
// o abrir el buscador se muestra al instante lo que ya se tenía y se refresca en segundo plano.
let cache: CatalogData | null = null;
let inflight: Promise<CatalogData> | null = null;

function load() {
  inflight ??= Promise.all([getProducts().catch(() => [] as Product[]), getCategories().catch(() => [] as Category[])])
    .then(([products, categories]) => {
      cache = {
        products: products.filter((p) => p.isActivo),
        categories: categories.filter((c) => c.isActive),
      };
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Catálogo activo (productos y categorías), actualizado en vivo cuando el admin lo cambia. */
export function useCatalog({ enabled = true }: { enabled?: boolean } = {}) {
  const [data, setData] = useState<CatalogData | null>(cache);
  const version = useLiveVersion("products", "plans", "categories");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load().then((d) => !cancelled && setData(d));
    return () => {
      cancelled = true;
    };
  }, [enabled, version]);

  return { products: data?.products ?? [], categories: data?.categories ?? [], isLoading: !data };
}
