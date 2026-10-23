"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { useFavorites } from "@/hooks/useFavorites";
import api from "@/lib/axios";
import type { Product } from "@/types";

// Productos guardados con el corazón. Quitar uno desde aquí lo saca de la lista al instante.
export function MyFavorites() {
  const { isFavorite, count } = useFavorites();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: Product[] }>("/favorites")
      .then((res) =>
        !cancelled &&
        setProducts(
          res.data.data.map((p) => ({
            ...p,
            plans: p.plans?.map((pl) => ({ ...pl, precio: Number(pl.precio), precioOriginal: pl.precioOriginal == null ? undefined : Number(pl.precioOriginal) })),
          }))
        )
      )
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, [count]);

  const visible = (products ?? []).filter((p) => isFavorite(p.id));

  if (!products) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Heart className="size-6" />
        </span>
        <p className="mt-4 font-bold">Aún no tienes favoritos</p>
        <p className="mt-1 text-sm text-muted-foreground">Toca el corazón en cualquier producto para guardarlo aquí y comprarlo después.</p>
        <Button className="mt-5 rounded-lg" render={<Link href="/products" />} nativeButton={false}>
          Explorar productos
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {visible.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
