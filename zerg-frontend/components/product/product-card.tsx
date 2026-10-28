"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Heart, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCover } from "./product-cover";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { activePlans, bestDiscount, cheapestPlan, discountPercent, formatPrice } from "@/lib/catalog";
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

  return (
    <article
      className={cn(
        "group relative flex rounded-2xl border bg-card p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_12px_32px_-12px_rgb(5_196_138/0.35)]",
        isList ? "flex-col gap-4 sm:flex-row" : "flex-col"
      )}
    >
      <Link href={href} className={cn("relative block shrink-0", isList && "sm:w-56")}>
        <ProductCover product={product} className="aspect-[4/3] rounded-xl" />
        {discount > 0 && (
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
          <h3 className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-brand-strong">
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
                  <p className="text-xs text-muted-foreground">por {plan.duracion}</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {plans.length > 1 ? (
              <Select
                value={plan?.id ?? null}
                onValueChange={(v) => v && setPlanId(v as string)}
                items={plans.map((p) => ({ value: p.id, label: p.nombre }))}
              >
                <SelectTrigger aria-label="Plan" className="h-9 w-[5.25rem] shrink-0 bg-background px-2 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-40">
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <span className="truncate">{p.nombre}</span>
                      <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">{formatPrice(p.precio)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              plan && (
                <span className="inline-flex h-9 w-[5.25rem] shrink-0 items-center justify-center truncate rounded-lg border border-input px-1 text-xs font-medium">
                  {plan.nombre}
                </span>
              )
            )}
            <Button
              className={cn(
                "h-9 min-w-0 flex-1 rounded-lg text-xs font-semibold",
                inCart && "bg-brand text-brand-ink hover:bg-brand/90"
              )}
              disabled={!plan}
              onClick={() => plan && addItem(plan, product)}
            >
              {inCart ? <Check className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
              {inCart ? "Agregado" : "Añadir"}
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-brand" />
              </span>
              Disponible
            </span>
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
