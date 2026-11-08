"use client";

import * as React from "react";
import { assetUrl } from "@/lib/site-settings";
import { cn } from "@/lib/utils";
import { ProductCover } from "./product-cover";
import type { Product } from "@/types";

interface ProductGalleryProps {
  product: Product;
  className?: string;
}

// Galería de la ficha: la foto principal arriba y las miniaturas debajo.
// La portada (imagenUrl) siempre va primero; el resto es la galería del admin.
// Cada foto se recorta con object-cover a la proporción del contenedor.
export function ProductGallery({ product, className }: ProductGalleryProps) {
  // La portada va primera y no se repite aunque aparezca también en la galería.
  // Las fotos que no cargan se quitan de la galería en vez de mostrarse rotas.
  const [broken, setBroken] = React.useState<string[]>([]);
  const markBroken = React.useCallback(
    (url: string) => setBroken((prev) => (prev.includes(url) ? prev : [...prev, url])),
    []
  );
  const images = [product.imagenUrl, ...(product.galeria ?? [])].filter(
    (url, i, all): url is string => Boolean(url) && all.indexOf(url) === i && !broken.includes(url as string)
  );

  // La selección se guarda junto al id: si cambia de producto vuelve a la portada sin efectos.
  const [selection, setSelection] = React.useState<{ id: string; index: number }>({ id: product.id, index: 0 });
  const active = selection.id === product.id ? Math.min(selection.index, images.length - 1) : 0;
  const current = images[active];

  if (!current) {
    return <ProductCover product={product} size="lg" priority className={cn("aspect-video rounded-2xl", className)} />;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <ProductCover product={product} src={current} size="lg" priority className="aspect-video rounded-2xl" onImageError={markBroken} />

      {images.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setSelection({ id: product.id, index: i })}
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                aria-pressed={i === active}
                className={cn(
                  "size-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                  i === active ? "border-brand" : "border-transparent hover:border-muted-foreground/40"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(url)} alt="" loading="lazy" onError={() => markBroken(url)} className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
