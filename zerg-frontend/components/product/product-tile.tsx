import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCover } from "./product-cover";
import { activePlans, bestDiscount, cheapestPlan, formatPrice, isSoldOut, soldOutLabel } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function planCountLabel(product: Product) {
  const n = activePlans(product).length;
  return `${n} ${n === 1 ? "plan" : "planes"}`;
}

// Tarjeta compacta para tendencias y carruseles. Muestra la imagen de tarjeta (cuadrada, 1000×1000)
// completa, sin recortes ni texto encima; el nombre y el precio van debajo, en la tarjeta.
// La grande (destacada) ocupa dos filas desde sm: su imagen llena el alto disponible.
export function ProductTile({
  product,
  size = "sm",
  className,
}: {
  product: Product;
  size?: "sm" | "lg";
  className?: string;
}) {
  const plan = cheapestPlan(product);
  const discount = bestDiscount(product);
  const soldOut = isSoldOut(product);
  const lg = size === "lg";

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all duration-300 hover:-translate-y-0.5 hover:ring-brand/60 hover:shadow-[0_16px_40px_-18px_rgb(5_196_138/0.55)]",
        className
      )}
    >
      <div className={cn("relative overflow-hidden", lg ? "aspect-square sm:aspect-auto sm:min-h-0 sm:flex-1" : "aspect-square")}>
        <ProductCover
          product={product}
          size={lg ? "lg" : "md"}
          showCategory={false}
          variant="tarjeta"
          sizes={lg ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 440px" : "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"}
          className={cn("absolute inset-0", soldOut && "opacity-60 grayscale")}
        />
        <span
          className={cn(
            "absolute top-2 right-2 max-w-[70%] truncate rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm",
            soldOut ? "bg-destructive text-white" : discount > 0 ? "bg-brand-yellow text-brand-ink" : "bg-black/55 text-white backdrop-blur-sm"
          )}
        >
          {soldOut ? soldOutLabel(product) : discount > 0 ? `-${discount}%` : planCountLabel(product)}
        </span>
      </div>

      {/* Alto fijo del pie: el de la grande mide el doble que el de las chicas, así su imagen
          (que ocupa dos filas) también queda cuadrada y no se recorta */}
      <div className={cn("flex shrink-0 items-center gap-3 border-t", lg ? "px-5 py-4 sm:h-28 sm:py-0" : "h-14 px-3")}>
        <div className="min-w-0 flex-1">
          <p className={cn("line-clamp-1 font-bold group-hover:text-brand-strong", lg ? "text-xl md:text-2xl" : "text-sm")}>{product.nombre}</p>
          {plan && (
            <p className={cn("text-muted-foreground", lg ? "mt-0.5 text-sm" : "text-xs")}>
              Desde <span className="font-semibold text-brand-strong">{formatPrice(plan.precio)}</span>
              {lg && <> · {planCountLabel(product)}</>}
            </p>
          )}
        </div>
        {lg && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="size-4" />
          </span>
        )}
      </div>
    </Link>
  );
}
