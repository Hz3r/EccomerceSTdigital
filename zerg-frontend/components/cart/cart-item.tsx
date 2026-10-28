"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ProductCover } from "@/components/product/product-cover";
import { MAX_QUANTITY, useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/catalog";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();

  return (
    <div className="flex gap-4 p-4 md:p-5">
      <Link href={`/product/${item.producto.slug}`} className="group shrink-0">
        <ProductCover product={item.producto} size="sm" className="size-20 rounded-xl md:size-24" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {item.producto.category?.nombre ?? "Digital"}
          </p>
          <Link href={`/product/${item.producto.slug}`} className="block truncate font-semibold hover:text-brand-strong">
            {item.producto.nombre}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Plan {item.plan.duracion} · {formatPrice(item.plan.precio)} c/u
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="flex h-9 items-center rounded-lg border">
            <button
              type="button"
              aria-label="Disminuir cantidad"
              title={item.cantidad <= 1 ? "Para quitarlo usa el botón eliminar" : undefined}
              disabled={item.cantidad <= 1}
              onClick={() => updateQuantity(item.planId, item.cantidad - 1)}
              className="flex h-full w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted-foreground"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-semibold">{item.cantidad}</span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              disabled={item.cantidad >= MAX_QUANTITY}
              onClick={() => updateQuantity(item.planId, item.cantidad + 1)}
              className="flex h-full w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <p className="w-20 text-right font-bold">{formatPrice(item.plan.precio * item.cantidad)}</p>
          <button
            type="button"
            aria-label="Eliminar del carrito"
            onClick={() => removeItem(item.planId)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
