"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, Check, Heart, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCover } from "./product-cover";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { activePlans, bestDiscount, cheapestPlan, discountPercent, formatPrice, isSoldOut, planLabel, soldOutLabel, stockLabel } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  layout?: "grid" | "list";
}

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const { addItem, items } = useCart();
  const plans = activePlans(product);
  const [planId, setPlanId] = useState(() => cheapestPlan(product)?.id ?? "");
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const discount = plan ? discountPercent(plan) : bestDiscount(product);
  const inCart = plan ? items.some((i) => i.planId === plan.id) : false;
  const href = `/product/${product.slug}`;
  const isList = layout === "list";
  const soldOut = isSoldOut(product);
  const stock = stockLabel(product);

  return (
    <article
      className={cn(
        "group relative flex rounded-2xl border bg-card p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_12px_32px_-12px_rgb(5_196_138/0.35)]",
        isList ? "flex-col gap-4 sm:flex-row" : "flex-col"
      )}
    >
      <Link href={href} className={cn("relative block shrink-0", isList && "sm:w-56")}>
        <ProductCover product={product} className={cn("aspect-video rounded-xl", soldOut && "opacity-60 grayscale")} />
        {soldOut && (
          // Aviso de agotado sobre la portada: el producto se sigue viendo, pero se nota que no hay
          <span className="absolute top-2.5 right-2.5 left-2.5 flex justify-end">
            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-surface-ink/90 px-2.5 py-0.5 text-xs font-bold text-white shadow-lg ring-1 ring-white/10 backdrop-blur-sm">
              <Ban className="size-3.5 shrink-0 text-destructive" />
              <span className="truncate">{soldOutLabel(product)}</span>
            </span>
          </span>
        )}
        {discount > 0 && !soldOut && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-brand-yellow px-2.5 py-0.5 text-xs font-bold text-brand-ink shadow-sm">
            -{discount}%
          </span>
        )}
      </Link>

      <div className={cn("flex flex-1 flex-col", isList ? "sm:py-1" : "px-1 pt-3")}>
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="truncate font-medium tracking-wide uppercase">{product.category?.nombre ?? "Digital"}</span>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-brand-strong">
            <Zap className="size-3 fill-current" />
            Inmediata
          </span>
        </div>

        <Link href={href} className="mt-1.5">
          {/* Hasta 2 líneas; en la grilla reserva el alto de 2 para que las tarjetas queden alineadas */}
          <h3 className={cn("line-clamp-2 leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-strong", !isList && "min-h-[2.75em]")}>
            {product.nombre}
          </h3>
        </Link>
        {product.descripcion && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{product.descripcion}</p>
        )}

        <div className="mt-auto pt-4">
          {plan && (
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xl font-extrabold tracking-tight text-foreground">{formatPrice(plan.precio)}</p>
                {plan.precioOriginal && plan.precioOriginal > plan.precio ? (
                  <p className="text-xs text-muted-foreground line-through">{formatPrice(plan.precioOriginal)}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">por {planLabel(plan)}</p>
                )}
              </div>
            </div>
          )}

          {/* Selector de plan a todo el ancho (los nombres largos ya no se cortan) y el botón debajo */}
          <div className="mt-3 flex flex-col gap-2">
            {plans.length > 1 && (
              <Select
                value={plan?.id ?? null}
                onValueChange={(v) => v && setPlanId(v as string)}
                items={plans.map((p) => ({ value: p.id, label: p.nombre }))}
              >
                <SelectTrigger aria-label="Plan" className="h-9 w-full min-w-0 bg-background px-2.5 text-xs font-medium [&_[data-slot=select-value]]:truncate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-56">
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <span className="min-w-0 truncate">{p.nombre}</span>
                      <span className="ml-auto shrink-0 pl-3 text-muted-foreground tabular-nums">{formatPrice(p.precio)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              className={cn(
                "h-9 w-full rounded-lg text-xs font-semibold",
                inCart && !soldOut && "bg-brand text-brand-ink hover:bg-brand/90",
                soldOut && "bg-muted text-muted-foreground disabled:opacity-100"
              )}
              disabled={!plan || soldOut}
              onClick={() => plan && !soldOut && addItem(plan, product)}
            >
              {soldOut ? <Ban className="size-3.5" /> : inCart ? <Check className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
              {soldOut ? "Sin stock" : inCart ? "Agregado" : "Añadir al carrito"}
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            {soldOut ? (
              <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-destructive">
                <span className="inline-flex size-2 shrink-0 rounded-full bg-destructive" />
                <span className="truncate">{soldOutLabel(product)}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-brand" />
                </span>
                {stock ? <span className="font-medium text-foreground">{stock}</span> : "Disponible"}
              </span>
            )}
            <button
              type="button"
              aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              aria-pressed={favorite}
              onClick={() => toggleFavorite(product.id, product.nombre)}
              className="rounded-md p-1 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Heart className={cn("size-4", favorite && "fill-destructive text-destructive")} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
