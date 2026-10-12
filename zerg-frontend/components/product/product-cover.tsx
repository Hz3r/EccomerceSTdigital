import Image from "next/image";
import { cn } from "@/lib/utils";
import { coverFor } from "@/lib/catalog";
import { CategoryIcon } from "./category-icon";
import type { Product } from "@/types";

interface ProductCoverProps {
  product: Product;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Portada del producto: usa la imagen si existe; si no, genera una tarjeta con los colores de ZERG.
export function ProductCover({ product, className, size = "md" }: ProductCoverProps) {
  if (product.imagenUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={product.imagenUrl}
          alt={product.nombre}
          fill
          unoptimized
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
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 font-medium backdrop-blur-sm",
            size === "lg" ? "text-sm" : "text-[11px]"
          )}
        >
          <CategoryIcon slug={product.category?.slug} className={size === "lg" ? "size-4" : "size-3"} />
          {product.category?.nombre ?? "Digital"}
        </span>
      </div>
    </div>
  );
}
