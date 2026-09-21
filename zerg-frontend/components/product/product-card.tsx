import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const minPrice = product.plans?.length
    ? Math.min(...product.plans.filter((p) => p.isActivo).map((p) => p.precio))
    : null;

  const hasDiscount = product.plans?.some(
    (p) => p.precioOriginal && p.precioOriginal > p.precio
  );

  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-all group-hover:ring-foreground/20 group-hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          {product.imagenUrl ? (
            <Image
              src={product.imagenUrl}
              alt={product.nombre}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-4xl">📦</span>
            </div>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Oferta
            </Badge>
          )}
        </div>
        <div className="p-4">
          {product.category && (
            <p className="text-xs text-muted-foreground">{product.category.nombre}</p>
          )}
          <h3 className="mt-1 font-medium text-foreground">{product.nombre}</h3>
          {minPrice !== null && (
            <p className="mt-2 text-sm font-semibold text-foreground">
              Desde ${minPrice.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
