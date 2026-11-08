"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { coverFor } from "@/lib/catalog";
import { API_ORIGIN, assetUrl } from "@/lib/site-settings";
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
   * "portada": la imagen horizontal (ficha, catálogo, destacado).
   * "tarjeta": la imagen cuadrada para tarjetas pequeñas o altas; si el producto no tiene, usa la portada.
   */
  variant?: "portada" | "tarjeta";
  /** Imagen visible al abrir la página (portada destacada, primeras tarjetas): se pide primero. */
  priority?: boolean;
  /** Ancho con que se muestra, para pedir el tamaño justo. Por defecto según `size`. */
  sizes?: string;
}

const SIZES = {
  sm: "96px",
  md: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px",
  lg: "(max-width: 1024px) 100vw, 720px",
};

// Solo las imágenes subidas al backend pasan por el optimizador de Next (las de otros sitios se muestran tal cual).
const optimizable = (url: string) => url.startsWith(`${API_ORIGIN}/api/uploads/`);

// Portada del producto: usa la imagen si existe; si no, genera una tarjeta con los colores de ZERG.
export function ProductCover({ product, src, className, size = "md", showCategory = true, onImageError, variant = "portada", priority = false, sizes }: ProductCoverProps) {
  const image = src ?? (variant === "tarjeta" ? product.imagenTarjeta || product.imagenUrl : product.imagenUrl);
  // Si la imagen no carga (borrada, URL rota), se muestra la portada generada en vez del ícono roto.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  // Si la versión optimizada falla, se intenta una vez con el archivo original antes de rendirse.
  const [rawSrc, setRawSrc] = React.useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = React.useState<string | null>(null);

  const handleError = () => {
    if (!image) return;
    const url = assetUrl(image);
    if (optimizable(url) && rawSrc !== image) {
      setRawSrc(image);
      return;
    }
    setFailedSrc(image);
    onImageError?.(image);
  };

  if (image && failedSrc !== image) {
    const url = assetUrl(image);
    const loaded = loadedSrc === image;
    // Llena el box por completo y recorta solo el exceso mínimo según la proporción
    // de cada marco (object-cover), sin dejar espacios vacíos. Mientras carga se ve un brillo
    // suave y la foto aparece con un fundido, sin saltos.
    return (
      <div className={cn("relative overflow-hidden bg-muted", !loaded && "image-shimmer", className)}>
        <Image
          key={rawSrc === image ? "raw" : "opt"}
          src={url}
          alt={product.nombre}
          fill
          unoptimized={!optimizable(url) || rawSrc === image}
          priority={priority}
          quality={size === "sm" ? 75 : 85}
          onLoad={() => setLoadedSrc(image)}
          onError={handleError}
          sizes={sizes ?? SIZES[size]}
          className={cn(
            "object-cover transition-[opacity,scale,transform] duration-500 group-hover:scale-105",
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
          )}
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
