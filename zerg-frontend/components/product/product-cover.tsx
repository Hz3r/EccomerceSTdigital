"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { coverFor } from "@/lib/catalog";
import { assetUrl } from "@/lib/site-settings";
import { CategoryIcon } from "./category-icon";
import type { Product } from "@/types";

interface ProductCoverProps {
  product: Product;
  /** Foto concreta a mostrar. Sin esta prop se usa la portada del producto. */
  src?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showCategory?: boolean;
  /** Avisa cuando la foto no carga (la galería la quita de las miniaturas). */
  onImageError?: (src: string) => void;
  /**
   * "cover" llena el marco recortando lo que sobra (bien cuando el marco tiene la forma de la foto).
   * "contain" muestra la foto completa sobre una copia difuminada de sí misma: se adapta a marcos
   * cuadrados o altos sin cortar el logo ni el texto del banner.
   */
  fit?: "cover" | "contain";
  /** Con fit="contain": zona donde se coloca la foto (ej. dejar espacio abajo para el nombre). */
  containClassName?: string;
}

// Portada del producto: usa la imagen si existe; si no, genera una tarjeta con los colores de ZERG.
export function ProductCover({ product, src, className, size = "md", showCategory = true, onImageError, fit = "cover", containClassName }: ProductCoverProps) {
  const image = src ?? product.imagenUrl;
  // Si la imagen no carga (borrada, URL rota), se muestra la portada generada en vez del ícono roto.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  const handleError = () => {
    if (!image) return;
    setFailedSrc(image);
    onImageError?.(image);
  };

  if (image && failedSrc !== image && fit === "contain") {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        {/* Fondo: la misma foto ampliada y difuminada para rellenar el marco sin bandas vacías */}
        <Image
          src={assetUrl(image)}
          alt=""
          aria-hidden
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 33vw"
          className="scale-125 object-cover opacity-70 blur-2xl saturate-150"
        />
        {/* span y no div: así los estilos de las tarjetas para la portada generada ([&>div:last-child]) no le afectan */}
        <span className={cn("absolute inset-0 block", containClassName)}>
          <span className="relative block size-full">
            <Image
              src={assetUrl(image)}
              alt={product.nombre}
              fill
              unoptimized
              onError={handleError}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
            />
          </span>
        </span>
      </div>
    );
  }

  if (image && failedSrc !== image) {
    // Llena el box por completo y recorta solo el exceso mínimo según la proporción
    // de cada marco (object-cover), sin dejar espacios vacíos.
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={assetUrl(image)}
          alt={product.nombre}
          fill
          unoptimized
          onError={handleError}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  const cover = coverFor(product.slug);
  const initials = product.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
      role="img"
      aria-label={product.nombre}
    >
      {/* Rombos del logo */}
      <span
        className="absolute -right-6 -bottom-6 size-24 rotate-45 rounded-md opacity-25"
        style={{ backgroundColor: cover.accent }}
      />
      <span
        className="absolute top-4 right-5 size-4 rotate-45 rounded-[3px]"
        style={{ backgroundColor: "var(--brand-yellow)" }}
      />
      <span
        className="absolute top-9 right-10 size-2.5 rotate-45 rounded-[2px] opacity-80"
        style={{ backgroundColor: cover.accent }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgb(255_255_255/0.22),transparent_55%)]" />

      <div className="relative flex h-full flex-col items-center justify-center gap-2 p-4 text-white transition-transform duration-500 group-hover:scale-105">
        <span
          className={cn(
            "font-black tracking-tighter drop-shadow-sm",
            size === "sm" && "text-2xl",
            size === "md" && "text-4xl",
            size === "lg" && "text-7xl"
          )}
        >
          {initials}
        </span>
        {showCategory && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 font-medium backdrop-blur-sm",
              size === "lg" ? "text-sm" : "text-[11px]"
            )}
          >
            <CategoryIcon slug={product.category?.slug} className={size === "lg" ? "size-4" : "size-3"} />
            {product.category?.nombre ?? "Digital"}
          </span>
        )}
      </div>
    </div>
  );
}
