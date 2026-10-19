"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { PickOption } from "@/components/cms/form";
import type { Category, Product } from "@/types";

// Opciones para elegir categorías y productos en las páginas de contenido.
export function useCatalogOptions() {
  const [categories, setCategories] = useState<PickOption[]>([]);
  const [products, setProducts] = useState<PickOption[]>([]);

  useEffect(() => {
    Promise.all([api.get<{ data: Category[] }>("/categories"), api.get<{ data: Product[] }>("/products")])
      .then(([cats, prods]) => {
        setCategories(cats.data.data.map((c) => ({ value: c.slug, label: c.nombre, hint: c.isActive ? undefined : "Oculta" })));
        setProducts(
          prods.data.data
            .filter((p) => p.isActivo)
            .map((p) => ({ value: p.slug, label: p.nombre, hint: p.category?.nombre }))
        );
      })
      .catch(() => {});
  }, []);

  return { categories, products };
}
